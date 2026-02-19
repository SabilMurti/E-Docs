import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabsView } from './TabsView';

export const Tabs = Node.create({
  name: 'tabs',
  group: 'block',
  content: 'tabItem+',
  defining: true,
  isolating: true,

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
      setTabs: () => ({ commands }) => {
        return commands.insertContent({
          type: 'tabs',
          attrs: { activeTab: 0 },
          content: [
            { 
              type: 'tabItem', 
              attrs: { title: 'Tab 1', isActive: true }, 
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Isi konten untuk Tab 1 di sini...' }] }] 
            },
            { 
              type: 'tabItem', 
              attrs: { title: 'Tab 2', isActive: false }, 
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Isi konten untuk Tab 2 di sini...' }] }] 
            }
          ]
        });
      },
      addTab: () => ({ state, dispatch }) => {
        const { selection } = state;
        let tabsPos = -1;

        // Search upwards for the 'tabs' node
        for (let d = selection.$from.depth; d >= 0; d--) {
          const nodeAtDepth = state.doc.nodeAt(selection.$from.before(d));
          if (nodeAtDepth?.type.name === 'tabs') {
            tabsPos = selection.$from.before(d);
            break;
          }
        }

        if (tabsPos === -1) return false;

        const tabsNode = state.doc.nodeAt(tabsPos);
        if (dispatch) {
          const insertPos = tabsPos + tabsNode.nodeSize - 1;
          const tr = state.tr.insert(insertPos, state.schema.nodes.tabItem.create({
            title: `Tab ${tabsNode.childCount + 1}`,
            isActive: false
          }, state.schema.nodes.paragraph.create()));
          dispatch(tr);
        }
        return true;
      }
    }
  }
});
