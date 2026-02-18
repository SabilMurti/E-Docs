import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { uploadFile } from '../../../api/upload';
import { toast } from 'sonner';

/**
 * Handle file upload logic for both images and other files
 */
export const performUpload = (view, file, pos) => {
  const toastId = toast.loading(`Uploading ${file.name}...`);

  uploadFile(file).then(data => {
    const { schema } = view.state;
    let node;

    if (data.is_image) {
      // Create image node
      node = schema.nodes.image.create({ 
        src: data.url, 
        alt: data.filename 
      });
    } else {
      // Create file attachment node if schema supports it
      if (schema.nodes.fileAttachment) {
        node = schema.nodes.fileAttachment.create({
          src: data.url,
          title: data.filename,
          size: data.size,
          type: data.type,
        });
      } else {
        const text = schema.text(data.filename);
        if (schema.marks.link) {
           const mark = schema.marks.link.create({ href: data.url });
           node = schema.nodes.paragraph.create(null, text.mark([mark]));
        } else {
           node = schema.nodes.paragraph.create(null, text);
        }
      }
    }

    let tr = view.state.tr;
    if (pos) {
       tr = tr.insert(pos, node);
    } else {
       tr = tr.replaceSelectionWith(node);
    }
    view.dispatch(tr);
    
    toast.dismiss(toastId);
    toast.success('Uploaded successfully');
  }).catch(err => {
    console.error('Upload failed:', err);
    toast.error('Failed to upload file', { id: toastId });
  });
};

export const ImageUpload = Extension.create({
  name: 'imageUpload',

  addCommands() {
    return {
      triggerImageUpload: () => ({ view }) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            performUpload(view, file);
          }
        };
        input.click();
        return true;
      },
      triggerFileUpload: () => ({ view }) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            performUpload(view, file);
          }
        };
        input.click();
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);
            const images = items.filter(item => item.type.indexOf('image') === 0);

            if (images.length === 0) return false;

            event.preventDefault();

            images.forEach(item => {
              const file = item.getAsFile();
              if (file) {
                performUpload(view, file);
              }
            });

            return true;
          },
          handleDrop(view, event) {
            const hasFiles = event.dataTransfer?.files?.length > 0;
            if (!hasFiles) return false;

            event.preventDefault();

            const files = Array.from(event.dataTransfer.files);
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

            files.forEach(file => {
              performUpload(view, file, coordinates?.pos);
            });

            return true;
          }
        }
      })
    ];
  },
});
