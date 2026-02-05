// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// App URL
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

// Roles
export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

// Visibility
export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};
