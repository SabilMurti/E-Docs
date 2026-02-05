import client from './client';

/**
 * Get page tree for a space
 */
export const getPages = async (spaceId) => {
  const response = await client.get(`/spaces/${spaceId}/pages`);
  return response.data;
};

/**
 * Get a single page
 */
export const getPage = async (spaceId, pageId) => {
  const response = await client.get(`/spaces/${spaceId}/pages/${pageId}`);
  return response.data;
};

/**
 * Create a new page
 */
export const createPage = async (spaceId, data) => {
  const response = await client.post(`/spaces/${spaceId}/pages`, data);
  return response.data;
};

/**
 * Update a page
 */
export const updatePage = async (spaceId, pageId, data) => {
  const response = await client.put(`/spaces/${spaceId}/pages/${pageId}`, data);
  return response.data;
};

/**
 * Delete a page
 */
export const deletePage = async (spaceId, pageId) => {
  const response = await client.delete(`/spaces/${spaceId}/pages/${pageId}`);
  return response.data;
};

/**
 * Reorder pages
 */
export const reorderPages = async (spaceId, pages) => {
  const response = await client.post(`/spaces/${spaceId}/pages/reorder`, { pages });
  return response.data;
};

export default {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  reorderPages,
};
