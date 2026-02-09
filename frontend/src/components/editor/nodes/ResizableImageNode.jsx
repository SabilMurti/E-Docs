import { NodeViewWrapper } from '@tiptap/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function ResizableImageNode(props) {
  const { node, updateAttributes, selected } = props;
  const [resizing, setResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Helper to ensure width string for style
  const getStyleWidth = () => {
    const w = node.attrs.width;
    if (typeof w === 'number') return `${w}px`;
    if (!w) return '100%';
    return w;
  };

  // Local state for width input to allow typing
  const [inputWidth, setInputWidth] = useState('');

  // Sync local state with node attrs
  useEffect(() => {
    const w = node.attrs.width;
    if (typeof w === 'number') {
      setInputWidth(w.toString());
    } else if (typeof w === 'string' && w.endsWith('px')) {
      setInputWidth(parseInt(w, 10).toString());
    } else {
      setInputWidth('');
    }
  }, [node.attrs.width]);

  const handleWidthChange = (e) => {
    const val = e.target.value;
    setInputWidth(val); // Update local state immediately for smooth typing
    
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 50) {
      updateAttributes({ width: num });
    }
  };

  const startResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    setInitialX(e.clientX);
    
    if (containerRef.current) {
        setInitialWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!resizing) return;
    
    // Smooth resizing: Direct DOM manipulation first?
    // No, React state update is usually fast enough if no heavy transition
    // Just ensure 'transition-all' is removed during resize
    
    const deltaX = e.clientX - initialX;
    const newWidth = Math.max(100, initialWidth + deltaX);
    
    updateAttributes({ width: newWidth });
  }, [resizing, initialX, initialWidth, updateAttributes]);

  const onMouseUp = useCallback(() => {
    setResizing(false);
  }, []);

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    } 
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [resizing, onMouseMove, onMouseUp]);

  return (
    <NodeViewWrapper className={`image-node-view relative my-6 group select-none flex justify-center`}>
      <figure 
        ref={containerRef}
        // Remove transition-all during resize for smoothness
        className={`relative inline-block ${resizing ? '' : 'transition-all duration-200'} ${selected || resizing ? 'ring-2 ring-blue-500 rounded-lg shadow-lg' : ''}`}
        style={{ width: getStyleWidth(), maxWidth: '100%', cursor: 'default' }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt}
          ref={imgRef}
          className="rounded-lg w-full h-auto block pointer-events-none" 
        />
        
        {/* Resize Handle (Corner) */}
        <div 
           className={`absolute bottom-2 right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md flex items-center justify-center transition-opacity z-10
             ${selected || resizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
           onMouseDown={startResize}
           title="Drag to resize"
        >
             <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </figure>
    </NodeViewWrapper>
  );
}
