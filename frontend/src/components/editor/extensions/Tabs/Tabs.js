import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabsView } from './TabsView';

export const Tabs = Node.create({
  name: 'tabs',
  group: 'block',
  content: 'tabItem+',
  defining: true,
  isolating: false,

  addAttributes() {
    return {
      activeTab: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tabs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tabs', class: 'tabs-container' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsView);
  },
  
  addCommands() {
    return {
      setTabs: () => ({ state, dispatch, editor }) => {
        const { schema, selection } = state;
        const { $from } = selection;

        // Build tab nodes with correct isActive attrs from the start
        const tab1 = schema.nodes.tabItem.create(
          { title: 'Tab 1', isActive: true },
          schema.nodes.paragraph.create()
        );
        const tab2 = schema.nodes.tabItem.create(
          { title: 'Tab 2', isActive: false },
          schema.nodes.paragraph.create()
        );
        const tabsNode = schema.nodes.tabs.create(
          { activeTab: 0 },
          [tab1, tab2]
        );

        if (dispatch) {
          // Insert the tabs block at the current block position
          const insertAt = $from.before($from.depth) < 0 ? 0 : $from.before($from.depth === 0 ? 1 : $from.depth);
          const tr = state.tr.insert(insertAt, tabsNode);

          // Place cursor inside Tab 1's paragraph (insertAt + 1 tabs open + 1 tabItem open + 1 paragraph open = +3)
          const cursorPos = insertAt + 3;
          if (cursorPos <= tr.doc.content.size) {
            tr.setSelection(
              state.selection.constructor.near(tr.doc.resolve(cursorPos))
            );
          }

          dispatch(tr);
        }
        return true;
      },

      addTab: () => ({ state, dispatch, tr }) => {
        const { selection } = state;
        let tabsPos = -1;
        let tabsNode = null;

        // Find the parent 'tabs' node - stop at depth 1 to avoid before(0) error
        for (let d = selection.$from.depth; d >= 1; d--) {
          const pos = selection.$from.before(d);
          const node = state.doc.nodeAt(pos);
          if (node?.type.name === 'tabs') {
            tabsPos = pos;
            tabsNode = node;
            break;
          }
        }

        if (tabsPos === -1 || !tabsNode) return false;

        if (dispatch) {
          const insertPos = tabsPos + tabsNode.nodeSize - 1;
          const newTab = state.schema.nodes.tabItem.create({
            title: `Tab ${tabsNode.childCount + 1}`,
            isActive: false
          }, state.schema.nodes.paragraph.create());
          
          const transaction = state.tr.insert(insertPos, newTab);
          dispatch(transaction);
        }
        return true;
      },
      deleteTab: (index) => ({ state, dispatch, editor }) => {
        // Find tabs node
        const { selection } = state;
        let tabsPos = -1;
        let tabsNode = null;

        for (let d = selection.$from.depth; d >= 1; d--) {
          const pos = selection.$from.before(d);
          const node = state.doc.nodeAt(pos);
          if (node?.type.name === 'tabs') {
            tabsPos = pos;
            tabsNode = node;
            break;
          }
        }

        if (tabsPos === -1 || !tabsNode || tabsNode.childCount <= 1) return false;

        if (dispatch) {
          let tabPos = tabsPos + 1;
          for (let i = 0; i < tabsNode.childCount; i++) {
            const child = tabsNode.child(i);
            if (i === index) {
              const from = tabPos;
              const to = tabPos + child.nodeSize;
              const tr = state.tr.delete(from, to);
              dispatch(tr);
              return true;
            }
            tabPos += child.nodeSize;
          }
        }
        return false;
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.setTabs(),
    };
  },
});
