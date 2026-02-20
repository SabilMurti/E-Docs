/**
 * Test Page - Table Debugging
 * Route: /test-table
 */

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableExtensions } from '../components/editor/extensions/Table';
import { TableBubbleMenu } from '../components/editor/extensions/Table';

export default function TestTable() {
  const [htmlOutput, setHtmlOutput] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ...TableExtensions,
    ],
    content: `
      <h2>Table Test</h2>
      <p>Click inside any cell to edit. If text disappears or shifts, there's a bug.</p>
      <table>
        <tbody>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
          <tr>
            <td>Cell A1</td>
            <td>Cell B1</td>
            <td>Cell C1</td>
          </tr>
          <tr>
            <td>Cell A2</td>
            <td>Cell B2</td>
            <td>Cell C2</td>
          </tr>
        </tbody>
      </table>
      <p>More text after table to test flow.</p>
    `,
    onUpdate: ({ editor }) => {
      setHtmlOutput(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border-secondary)] p-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Table Debug Test
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Route: /test-table - Testing Tiptap native table implementation
        </p>
      </div>

      {/* Toolbar */}
      <div className="border-b border-[var(--color-border-secondary)] p-4 flex gap-2">
        <button
          onClick={insertTable}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90"
        >
          Insert Table
        </button>
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          disabled={!editor.isActive('table')}
        >
          Delete Table
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Editor */}
        <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-secondary)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Editor (Interactive)
            </h3>
          </div>
          <div className="p-4">
            {editor.isActive('table') && (
              <TableBubbleMenu editor={editor} />
            )}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* HTML Output */}
        <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-secondary)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              HTML Output
            </h3>
          </div>
          <div className="p-4">
            <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap break-all bg-[var(--color-bg-tertiary)] p-4 rounded-lg max-h-[600px] overflow-auto">
              {htmlOutput}
            </pre>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-[var(--color-border-secondary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
          Test Checklist:
        </h3>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>□ Click inside table cells - text should be visible</li>
          <li>□ Type in cells - text should appear correctly</li>
          <li>□ Check if cell content shifts right</li>
          <li>□ Test merge/split cells</li>
          <li>□ Test background color picker</li>
          <li>□ Test alignment buttons</li>
          <li>□ Test add/delete row/column</li>
          <li>□ Check bubble menu appears on table focus</li>
        </ul>
      </div>
    </div>
  );
}
