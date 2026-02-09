import client from './client';

/**
 * Get page tree for a site
 */
export const getPages = async (siteId) => {
  const response = await client.get(`/sites/${siteId}/pages`);
  return response.data;
};

/**
 * Get a single page
 */
export const getPage = async (siteId, pageId) => {
  const response = await client.get(`/sites/${siteId}/pages/${pageId}`);
  return response.data;
};

/**
 * Create a new page
 */
export const createPage = async (siteId, data) => {
  const response = await client.post(`/sites/${siteId}/pages`, data);
  return response.data;
};

/**
 * Update a page
 */
export const updatePage = async (siteId, pageId, data) => {
  const response = await client.put(`/sites/${siteId}/pages/${pageId}`, data);
  return response.data;
};

/**
 * Delete a page
 */
export const deletePage = async (siteId, pageId) => {
  const response = await client.delete(`/sites/${siteId}/pages/${pageId}`);
  return response.data;
};

/**
 * Reorder pages
 */
export const reorderPages = async (siteId, pages) => {
  const response = await client.post(`/sites/${siteId}/pages/reorder`, { pages });
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
