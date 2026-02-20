/**
 * Table Extension - Using Tiptap's Native Table Extensions
 * Follows: @rich-text-editor-table-implementation.md
 */

import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

// Extended Table Header with custom attributes
export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.style.textAlign || 'left',
        renderHTML: (attributes) => {
          if (!attributes.textAlign) return {};
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
});

// Extended Table Cell with custom attributes
export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.style.textAlign || 'left',
        renderHTML: (attributes) => {
          if (!attributes.textAlign) return {};
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
});

// Configure and export table extensions
export const TableExtensions = [
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'custom-rich-table',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'custom-table-row',
    },
  }),
  CustomTableHeader.configure({
    HTMLAttributes: {
      class: 'custom-table-header',
    },
  }),
  CustomTableCell.configure({
    HTMLAttributes: {
      class: 'custom-table-cell',
    },
  }),
];

export default TableExtensions;
