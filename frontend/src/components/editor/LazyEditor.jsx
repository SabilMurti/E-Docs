import { lazy, Suspense } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

// Lazy load the heavy editor component
const TiptapEditor = lazy(() => import('./TiptapEditor'));

/**
 * LazyEditor Component
 * 
 * Wraps the TiptapEditor with Suspense for code-splitting.
 * This reduces the initial bundle size by loading the editor on-demand.
 * 
 * @param {Object} props
 * @param {Object} props.content - Initial content (TipTap JSON)
 * @param {Function} props.onChange - Callback when content changes
 * @param {boolean} props.editable - Whether editor is editable
 * @param {string} props.placeholder - Placeholder text
 */
export default function LazyEditor({
  content,
  onChange,
  editable = true,
  placeholder = '',
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TiptapEditor
        content={content}
        onChange={onChange}
        editable={editable}
        placeholder={placeholder}
      />
    </Suspense>
  );
}
