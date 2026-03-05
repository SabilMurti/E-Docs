import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import APIEndpointBlock from '../nodes/APIEndpointNode';

export const APIEndpoint = Node.create({
  name: 'apiEndpoint',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      method: {
        default: 'GET',
        parseHTML: element => element.getAttribute('data-method'),
        renderHTML: attributes => ({ 'data-method': attributes.method }),
      },
      endpoint: {
        default: '/api/v1/endpoint',
        parseHTML: element => element.getAttribute('data-endpoint'),
        renderHTML: attributes => ({ 'data-endpoint': attributes.endpoint }),
      },
      description: {
        default: '',
        parseHTML: element => element.getAttribute('data-description'),
        renderHTML: attributes => ({ 'data-description': attributes.description }),
      },
      lang: {
        default: 'bash',
        parseHTML: element => element.getAttribute('data-lang'),
        renderHTML: attributes => ({ 'data-lang': attributes.lang }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="api-endpoint"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'api-endpoint' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(APIEndpointBlock);
  },

  addCommands() {
    return {
      setAPIEndpoint: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});

export default APIEndpoint;
