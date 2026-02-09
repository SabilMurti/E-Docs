import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { uploadFile } from '../../../api/upload';
import { toast } from 'sonner';

/**
 * Handle file upload logic for both images and other files
 */
const performUpload = (view, file, pos) => {
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
          title: data.filename, // Using filename from server which is usually original name
          size: data.size,
          type: data.type,
        });
      } else {
        // Fallback: Link to file in paragraph
        // This is tricky if inside block, but valid schema wise usually
        const text = schema.text(data.filename);
        // Link mark might need href
        // schema.marks.link is standard
        if (schema.marks.link) {
           const mark = schema.marks.link.create({ href: data.url });
           // Wrap in paragraph for block insertion
           node = schema.nodes.paragraph.create(null, text.mark([mark]));
        } else {
           node = schema.nodes.paragraph.create(null, text);
        }
      }
    }

    let tr = view.state.tr;
    if (pos) {
       // Insert at specific dropped position
       tr = tr.insert(pos, node);
    } else {
       // Replace selection (paste)
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);
            // Paste handles primarily images
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
