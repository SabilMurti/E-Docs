import { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Maximize2, Save, Edit3 } from 'lucide-react';
import { Excalidraw, exportToSvg } from '@excalidraw/excalidraw';
import { createPortal } from 'react-dom';

// Import Excalidraw styles manually if Vite is not picking them up
import "@excalidraw/excalidraw/index.css";

export default function ExcalidrawComponent({ node, updateAttributes, editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [svgData, setSvgData] = useState(node.attrs.svgData || '');
  
  const elementsRef = useRef(node.attrs.elements || []);
  const stateRef = useRef(node.attrs.appState || {});

  // Sync internal state with node attributes when they change from outside
  useEffect(() => {
    if (node.attrs.svgData) setSvgData(node.attrs.svgData);
  }, [node.attrs.svgData]);

  const handleSave = async (edElements, edAppState) => {
    try {
      // Export to SVG for preview
      const svg = await exportToSvg({
        elements: edElements,
        appState: { ...edAppState, exportWithBlur: false },
        files: null,
      });
      
      const svgString = new XMLSerializer().serializeToString(svg);
      
      updateAttributes({
        elements: edElements,
        appState: edAppState,
        svgData: svgString
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to export Excalidraw SVG', error);
      setIsEditing(false);
    }
  };

  const handleSaveAction = () => {
    handleSave(elementsRef.current, stateRef.current);
  };

  return (
    <NodeViewWrapper className="excalidraw-node my-6">
      <div 
        className="relative group border-2 border-[var(--color-border-primary)] rounded-xl overflow-hidden bg-white dark:bg-neutral-900"
        style={{ minHeight: '300px' }}
      >
        {/* Preview Mode */}
        {svgData ? (
          <div 
            className="excalidraw-preview p-4 flex justify-center items-center cursor-pointer group"
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: svgData }}
          />
        ) : (
          <div 
            className="h-[300px] flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <Maximize2 size={48} className="opacity-20 mb-4" />
            <p className="text-sm px-4 text-center">Interactive Flowchart. Click to start building.</p>
          </div>
        )}
        
        {/* Hover Toolbar */}
        {editor.isEditable && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-[var(--color-accent)] text-white rounded-lg shadow-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              title="Edit Flowchart"
            >
              <Edit3 size={16} />
            </button>
          </div>
        )}

        {/* Editor Mode - Fullscreen Overlay via Portal */}
        {isEditing && createPortal(
          <div className="fixed inset-0 z-[100000] bg-white dark:bg-[#121212] flex flex-col overflow-hidden flowchart-editor-portal">
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
            
            <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] h-16 shrink-0 z-[10]">
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
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                    viewBackgroundColor: document.documentElement.classList.contains('dark') ? '#121212' : '#ffffff',
                    zenModeEnabled: false,
                    gridModeEnabled: false,
                  },
                  scrollToContent: true
                }}
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
