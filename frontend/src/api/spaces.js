import client from './client';

/**
 * Get all spaces the user has access to
 */
export const getSpaces = async () => {
  const response = await client.get('/spaces');
  return response.data;
};

/**
 * Get a single space by ID
 */
export const getSpace = async (id) => {
  const response = await client.get(`/spaces/${id}`);
  return response.data;
};

/**
 * Create a new space
 */
export const createSpace = async (data) => {
  const response = await client.post('/spaces', data);
  return response.data;
};

/**
 * Update a space
 */
export const updateSpace = async (id, data) => {
  const response = await client.put(`/spaces/${id}`, data);
  return response.data;
};

/**
 * Delete a space
 */
export const deleteSpace = async (id) => {
  const response = await client.delete(`/spaces/${id}`);
  return response.data;
};

/**
 * Publish a space (make public)
 */
export const publishSpace = async (id) => {
  const response = await client.post(`/spaces/${id}/publish`);
  return response.data;
};

export const unpublishSpace = async (id) => {
  const response = await client.post(`/spaces/${id}/unpublish`);
  return response.data;
};

/**
 * Search within a space
 */
export const searchSpace = async (id, query) => {
  const response = await client.get(`/spaces/${id}/search`, {
    params: { q: query }
  });
  return response.data;
};

export default {
  getSpaces,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  publishSpace,
  unpublishSpace,
  searchSpace,
};
