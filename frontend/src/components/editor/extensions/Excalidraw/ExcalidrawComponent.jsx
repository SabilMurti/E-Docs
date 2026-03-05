import { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Maximize2, Save, Edit3 } from 'lucide-react';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import { createPortal } from 'react-dom';

// Import Excalidraw styles manually if Vite is not picking them up
import "@excalidraw/excalidraw/index.css";

// Detect if dark mode is currently active
function getExcalidrawTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getExcalidrawBgColor() {
  return document.documentElement.classList.contains('dark') ? '#121212' : '#ffffff';
}

export default function ExcalidrawComponent({ node, updateAttributes, editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [svgData, setSvgData] = useState(node.attrs.svgData || '');
  const [currentTheme, setCurrentTheme] = useState(getExcalidrawTheme());
  
  const elementsRef = useRef(node.attrs.elements || []);
  const stateRef = useRef(node.attrs.appState || {});

  // Track theme changes (e.g. user switches between light/dark while editing)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentTheme(getExcalidrawTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync internal SVG state from node when it changes externally
  useEffect(() => {
    if (node.attrs.svgData) setSvgData(node.attrs.svgData);
  }, [node.attrs.svgData]);

  // When opening the editor, always load the latest saved elements
  useEffect(() => {
    if (isEditing) {
      elementsRef.current = node.attrs.elements || [];
      stateRef.current = node.attrs.appState || {};
    }
  }, [isEditing]);

  const handleSave = async (edElements, edAppState) => {
    try {
      // Deep-clone to avoid issues with Excalidraw's readonly/proxy objects
      const elements = JSON.parse(JSON.stringify(edElements || []));
      const appState = JSON.parse(JSON.stringify(edAppState || {}));

      // ── Step 1: Save elements immediately (don't block on SVG) ──
      updateAttributes({ elements, appState });

      // ── Step 2: Try to export SVG for preview ──
      const activeElements = elements.filter(el => !el.isDeleted);
      if (activeElements.length > 0) {
        try {
          const svg = await exportToSvg({
            elements: activeElements,
            appState: { ...appState, exportWithDarkMode: false },
            files: null,
          });
          const svgString = new XMLSerializer().serializeToString(svg);
          updateAttributes({ elements, appState, svgData: svgString });
          setSvgData(svgString);
        } catch (svgErr) {
          console.warn('SVG export failed, elements still saved:', svgErr);
        }
      } else {
        updateAttributes({ elements, appState, svgData: '' });
        setSvgData('');
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Flowchart save failed:', err);
      setIsEditing(false);
    }
  };

  const handleSaveAction = () => {
    handleSave(elementsRef.current, stateRef.current);
  };


  const isDark = currentTheme === 'dark';

  return (
    <NodeViewWrapper className="excalidraw-node my-6">
      <div 
        className="relative group border-2 border-[var(--color-border-primary)] rounded-xl overflow-hidden"
        style={{ 
          minHeight: '300px',
          background: isDark ? '#1a1a2e' : '#f8f9fa'
        }}
      >
        {/* Preview Mode */}
        {svgData ? (
          <div 
            className="excalidraw-preview p-4 flex justify-center items-center cursor-pointer group"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
            style={{ background: isDark ? '#1a1a2e' : '#f8f9fa' }}
            dangerouslySetInnerHTML={{ __html: svgData }}
          />
        ) : (
          <div 
            className="h-[300px] flex flex-col items-center justify-center text-[var(--color-text-muted)] cursor-pointer"
            style={{ background: isDark ? '#1a1a2e' : '#f0f2f5' }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
          >
            <Maximize2 size={48} className="opacity-20 mb-4" />
            <p className="text-sm px-4 text-center">Interactive Flowchart. Click to start building.</p>
          </div>
        )}
        
        {/* Hover Toolbar */}
        {editor.isEditable && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
              className="p-2 bg-[var(--color-accent)] text-white rounded-lg shadow-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              title="Edit Flowchart"
            >
              <Edit3 size={16} />
            </button>
          </div>
        )}

        {/* Editor Mode - Fullscreen Overlay via Portal */}
        {isEditing && createPortal(
          <div 
            className="fixed inset-0 z-[100000] flex flex-col overflow-hidden flowchart-editor-portal"
            style={{ background: isDark ? '#121212' : '#ffffff' }}
          >
            <style>{`
              .flowchart-editor-portal {
                font-family: var(--font-sans);
              }
              .excalidraw-wrapper {
                flex: 1;
                height: calc(100vh - 64px);
                width: 100vw;
                position: relative;
              }
              /* Force reset for excalidraw internal styles if needed */
              .excalidraw button {
                all: revert;
              }
            `}</style>
            
            <header 
              className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-primary)] h-16 shrink-0 z-[10]"
              style={{ background: isDark ? '#1e1e2e' : '#ffffff' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[var(--color-text-primary)] leading-tight">Flowchart Editor</h2>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Interactive Canvas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveAction}
                  className="px-6 py-2 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Diagram
                </button>
              </div>
            </header>
            
            <div className="excalidraw-wrapper">
              <Excalidraw 
                initialData={{
                  elements: elementsRef.current,
                  appState: { 
                    ...stateRef.current, 
                    theme: currentTheme,
                    viewBackgroundColor: isDark ? '#121212' : '#ffffff',
                    zenModeEnabled: false,
                    gridModeEnabled: false,
                    // Keep selected tool active after each use (like Figma)
                    toolLocked: true,
                    // Default to handwritten/chalk style
                    currentItemFontFamily: 1,        // 1 = Virgil (hand-drawn/chalk font)
                    currentItemTextAlign: 'center',  // center text in text boxes
                    currentItemRoughness: 1,         // 0=architect, 1=artist, 2=cartoonist
                    currentItemStrokeStyle: 'solid',
                  },
                  scrollToContent: true
                }}
                theme={currentTheme}
                onChange={(els, state) => {
                  elementsRef.current = els;
                  stateRef.current = state;
                }}
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </NodeViewWrapper>
  );
}


