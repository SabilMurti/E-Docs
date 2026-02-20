# Rich Text Editor - Table Implementation Guide

## Overview

This document describes the technical implementation of table functionality in a Tiptap-based rich text editor. The implementation uses **@tiptap/react** with extended table extensions for advanced customization.

---

## Technology Stack

- **Framework**: React
- **Rich Text Editor**: Tiptap (`@tiptap/react`)
- **Table Extension**: `@tiptap/extension-table`
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

---

## Required Dependencies

```bash
npm install @tiptap/react @tiptap/core @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-table-row lucide-react
```

---

## Core Implementation

### 1. Extension Setup

```javascript
import { useEditor, EditorContent } from '@tiptap/react';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';

const extensions = [
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full my-4',
    },
  }),
  TableRow,
  TableHeader.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.style.backgroundColor || null,
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {}
            return { style: `background-color: ${attributes.backgroundColor}` }
          },
        },
        borderColor: {
          default: '#cbd5e1',
          parseHTML: element => element.style.borderColor || null,
          renderHTML: attributes => {
            if (!attributes.borderColor) return {}
            return { style: `border-color: ${attributes.borderColor}` }
          },
        },
        borderWidth: {
          default: '1px',
          parseHTML: element => element.style.borderWidth || null,
          renderHTML: attributes => {
            if (!attributes.borderWidth) return {}
            return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
          },
        },
      }
    },
    renderHTML({ HTMLAttributes }) {
      return ['th', HTMLAttributes, 0];
    },
  }).configure({
    HTMLAttributes: {
      class: 'p-2 font-bold text-left bg-slate-100',
    },
  }),
  TableCell.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.style.backgroundColor || null,
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {}
            return { style: `background-color: ${attributes.backgroundColor}` }
          },
        },
        borderColor: {
          default: '#cbd5e1',
          parseHTML: element => element.style.borderColor || null,
          renderHTML: attributes => {
            if (!attributes.borderColor) return {}
            return { style: `border-color: ${attributes.borderColor}` }
          },
        },
        borderWidth: {
          default: '1px',
          parseHTML: element => element.style.borderWidth || null,
          renderHTML: attributes => {
            if (!attributes.borderWidth) return {}
            return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
          },
        },
      }
    },
  }).configure({
    HTMLAttributes: {
      class: 'p-2 relative vertical-top',
    },
  }),
];
```

### 2. Key Techniques

#### A. Extension Extension (Custom Attributes)

The implementation extends `TableHeader` and `TableCell` to add custom attributes:

- **`backgroundColor`**: Cell background color
- **`borderColor`**: Border color
- **`borderWidth`**: Border width with automatic border-style

```javascript
TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // Preserve parent attributes
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {}
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
      // ... other attributes
    }
  },
})
```

#### B. Table Insertion

```javascript
// Insert table with 3x3 dimensions and header row
editor.chain().focus().insertTable({ 
  rows: 3, 
  cols: 3, 
  withHeaderRow: true 
}).run();
```

#### C. Column Operations

```javascript
// Add column before current position
editor.chain().focus().addColumnBefore().run();

// Add column after current position
editor.chain().focus().addColumnAfter().run();

// Delete current column
editor.chain().focus().deleteColumn().run();
```

#### D. Row Operations

```javascript
// Add row before current position
editor.chain().focus().addRowBefore().run();

// Add row after current position
editor.chain().focus().addRowAfter().run();

// Delete current row
editor.chain().focus().deleteRow().run();
```

#### E. Cell Operations

```javascript
// Merge selected cells
editor.chain().focus().mergeCells().run();

// Split merged cell
editor.chain().focus().splitCell().run();

// Set cell attribute (backgroundColor, borderColor, borderWidth)
editor.chain().focus().setCellAttribute('backgroundColor', '#fef3c7').run();
```

#### F. Table Deletion

```javascript
// Delete entire table
editor.chain().focus().deleteTable().run();
```

---

## UI Implementation

### 1. Color Palette Configuration

```javascript
const TABLE_COLORS = [
  { color: '#ffffff', name: 'Putih' },
  { color: '#f8fafc', name: 'Slate' },
  { color: '#fee2e2', name: 'Merah' },
  { color: '#fef3c7', name: 'Kuning' },
  { color: '#dcfce7', name: 'Hijau' },
  { color: '#dbeafe', name: 'Biru' },
  { color: '#f3e8ff', name: 'Ungu' },
];
```

### 2. Color Picker Component

```jsx
{TABLE_COLORS.map((c) => (
  <button
    key={c.color}
    onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', c.color).run()}
    className="w-5 h-5 rounded-sm border border-slate-200"
    style={{ backgroundColor: c.color }}
    title={c.name}
    type="button"
  />
))}
```

### 3. Border Width Controls

```jsx
{[0, 1, 2, 4].map(w => (
  <button
    key={w}
    onClick={() => editor.chain().focus().setCellAttribute('borderWidth', `${w}px`).run()}
    className={`px-1.5 py-0.5 text-[9px] border border-slate-200 rounded font-bold ${
      w === 0 ? 'bg-red-50 text-red-600' : 'bg-white'
    }`}
    type="button"
  >
    {w === 0 ? 'OFF' : `${w}px`}
  </button>
))}
```

### 4. Conditional Toolbar Display

```jsx
const isTableActive = editor.isActive('table');

{isTableActive && (
  <div className="table-toolbar">
    {/* Table-specific controls */}
  </div>
)}
```

---

## CSS Styling

```css
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1.5rem 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.ProseMirror table td,
.ProseMirror table th {
  min-width: 1em;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.ProseMirror table th {
  font-weight: bold;
  text-align: left;
  background-color: #f8fafc;
}

.ProseMirror table .selectedCell:after {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(45, 126, 231, 0.1);
  pointer-events: none;
}

.ProseMirror .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: #3b82f6;
  pointer-events: auto;
  cursor: col-resize;
}
```

### Responsive Container

```jsx
<div className="overflow-x-auto custom-scrollbar">
  <EditorContent editor={editor} className="p-3" />
</div>
```

---

## Complete Example Component

```jsx
import { useEditor, EditorContent } from '@tiptap/react';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';

function RichTextEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {}
                return { style: `background-color: ${attributes.backgroundColor}` }
              },
            },
          }
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {}
                return { style: `background-color: ${attributes.backgroundColor}` }
              },
            },
          }
        },
      }),
    ],
    content: '',
  });

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          Insert Table
        </button>
        
        {editor.isActive('table') && (
          <>
            <button onClick={() => editor.chain().focus().addColumnBefore().run()}>
              + Column
            </button>
            <button onClick={() => editor.chain().focus().addRowBefore().run()}>
              + Row
            </button>
            <button onClick={() => editor.chain().focus().mergeCells().run()}>
              Merge
            </button>
            <button onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', '#fef3c7').run()}>
              Yellow Background
            </button>
            <button onClick={() => editor.chain().focus().deleteTable().run()}>
              Delete Table
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

---

## API Reference

### Table Extension Methods

| Method | Description |
|--------|-------------|
| `insertTable({ rows, cols, withHeaderRow })` | Insert a new table |
| `addColumnBefore()` | Add column before current selection |
| `addColumnAfter()` | Add column after current selection |
| `deleteColumn()` | Delete current column |
| `addRowBefore()` | Add row before current selection |
| `addRowAfter()` | Add row after current selection |
| `deleteRow()` | Delete current row |
| `mergeCells()` | Merge selected cells |
| `splitCell()` | Split merged cell |
| `setCellAttribute(name, value)` | Set cell attribute |
| `deleteTable()` | Delete entire table |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `resizable` | boolean | `false` | Enable column resizing |
| `HTMLAttributes` | object | `{}` | HTML attributes for table element |

---

## Best Practices

### 1. Performance Optimization

- Use `memo()` for toolbar components to prevent re-renders
- Debounce content updates (300ms recommended)
- Use `useMemo()` for extensions array

```javascript
const extensions = useMemo(() => [
  // extensions...
], [placeholder]);
```

### 2. User Experience

- Show table toolbar only when table is active
- Provide visual feedback for active states
- Use color swatches for quick selection
- Include color picker for custom colors

### 3. Accessibility

- Maintain semantic HTML (`<th>` for headers)
- Ensure sufficient color contrast
- Add descriptive titles to buttons

### 4. Data Persistence

```javascript
// Save HTML content
const html = editor.getHTML();

// Load content
editor.commands.setContent(html);
```

---

## Common Issues & Solutions

### Issue: Attributes not persisting

**Solution**: Ensure proper `parseHTML` and `renderHTML` configuration:

```javascript
backgroundColor: {
  parseHTML: element => element.style.backgroundColor || null,
  renderHTML: attributes => {
    if (!attributes.backgroundColor) return {}
    return { style: `background-color: ${attributes.backgroundColor}` }
  },
}
```

### Issue: Table overflow on mobile

**Solution**: Wrap editor in scrollable container:

```jsx
<div className="overflow-x-auto">
  <EditorContent editor={editor} />
</div>
```

### Issue: Toolbar re-renders causing lag

**Solution**: Memoize toolbar components and use debounced updates.

---

## License

This implementation is based on Tiptap's MIT-licensed extensions.

---

## Additional Resources

- [Tiptap Documentation](https://tiptap.dev/)
- [Table Extension Docs](https://tiptap.dev/api/nodes/table)
- [TableCell Extension Docs](https://tiptap.dev/api/nodes/table-cell)
- [TableHeader Extension Docs](https://tiptap.dev/api/nodes/table-header)
- [TableRow Extension Docs](https://tiptap.dev/api/nodes/table-row)
