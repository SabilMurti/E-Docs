import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Backend base URL (without /api suffix) used to resolve media/storage URLs
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * Resolves a potentially relative /storage/ path into an absolute URL.
 * Handles: relative (/storage/...), already-absolute (http://...), blob:, data:
 */
export const resolveImageUrl = (src) => {
  if (!src) return src;
  
  // If it's a blob or data URL, return as is
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // If it starts with localhost or 127.0.0.1 (common debug error), 
  // we want to strip that and resolve it against the current BACKEND_URL
  if (src.startsWith('http://localhost') || src.startsWith('http://127.0.0.1')) {
    // Strip until /storage/
    const storageIndex = src.indexOf('/storage/');
    if (storageIndex !== -1) {
      return `${BACKEND_URL}${src.substring(storageIndex)}`;
    }
  }

  // If it's already an absolute URL (but not localhost), return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Relative path like /storage/uploads/images/xxx.png
  // Ensure it starts with /
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${BACKEND_URL}${path}`;
};

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
