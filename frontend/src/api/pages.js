import client from './client';

/**
 * Get page tree for a site
 */
export const getPages = async (siteId, params = {}) => {
  const response = await client.get(`/sites/${siteId}/pages`, { params });
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
/**
 * Reorder pages
 */
export const reorderPages = async (siteId, pages) => {
  const response = await client.post(`/sites/${siteId}/pages/reorder`, { pages });
  return response.data;
};

/**
 * Create or update a change request (Draft / PR)
 * @param {string} pageId
 * @param {object} data { content, title, status: 'draft'|'open', description }
 */
export const createChangeRequest = async (pageId, data) => {
  const response = await client.post(`/pages/${pageId}/requests`, data);
  return response.data;
};

export const getChangeRequests = async (pageId) => {
  const response = await client.get(`/pages/${pageId}/requests`);
  return response.data;
};

export const mergeChangeRequest = async (requestId, data) => {
  const response = await client.post(`/requests/${requestId}/merge`, data);
  return response.data;
};

export const syncChangeRequest = async (requestId) => {
  const response = await client.post(`/requests/${requestId}/sync`);
  return response.data;
};

/**
 * Git-style commit (Save to self)
 */
export const commitChange = async (siteId, pageId, data) => {
  const response = await client.post(`/sites/${siteId}/pages/${pageId}/commits`, data);
  return response.data;
};

export const getCommits = async (requestId) => {
  const response = await client.get(`/requests/${requestId}/commits`);
  return response.data;
};

export default {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  reorderPages,
  createChangeRequest,
  getChangeRequests,
  mergeChangeRequest,
  syncChangeRequest,
  commitChange,
  getCommits,
};
