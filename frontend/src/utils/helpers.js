/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return past.toLocaleDateString();
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text to specified length
 */
export function truncate(text, length = 100) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function isEmpty(obj) {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

/**
 * Extract plain text from Tiptap JSON content
 */
/**
 * Extract plain text from Tiptap JSON content with structure preservation
 */
function extractTextRecursive(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  let text = '';
  
  if (content.text) {
    text += content.text;
  }
  
  if (content.content && Array.isArray(content.content)) {
    content.content.forEach(node => {
      text += extractTextRecursive(node);
    });
  }
  
  const blockTypes = [
    'paragraph', 'heading', 'codeBlock', 'bulletList', 
    'orderedList', 'listItem', 'blockquote', 'tableRow', 
    'horizontalRule', 'taskItem'
  ];
  
  if (blockTypes.includes(content.type) || content.type === 'hardBreak') {
    text += '\n';
  }

  if (content.type === 'image') {
    const alt = content.attrs?.alt ? `: ${content.attrs.alt}` : '';
    text += `[Image${alt}]\n`;
  }
  
  return text;
}

export function extractTiptapText(content) {
  return extractTextRecursive(content).trim();
}
