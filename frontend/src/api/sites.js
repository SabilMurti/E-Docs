import client from './client';

/**
 * Get all sites for current user
 */
export const getSites = async () => {
  const response = await client.get('/sites');
  return response.data;
};

/**
 * Get single site
 */
export const getSite = async (id) => {
  const response = await client.get(`/sites/${id}`);
  return response.data;
};

/**
 * Create new site
 */
export const createSite = async (data) => {
  const response = await client.post('/sites', data);
  return response.data;
};

/**
 * Update site
 */
export const updateSite = async (id, data) => {
  const response = await client.put(`/sites/${id}`, data);
  return response.data;
};

/**
 * Delete site
 */
export const deleteSite = async (id) => {
  const response = await client.delete(`/sites/${id}`);
  return response.data;
};

/**
 * Publish site
 */
export const publishSite = async (id) => {
  const response = await client.post(`/sites/${id}/publish`);
  return response.data;
};

/**
 * Unpublish site
 */
export async function unpublishSite(id) {
  const { data } = await client.post(`/sites/${id}/unpublish`);
  return data;
}

/**
 * Get site members
 */
export async function getSiteMembers(id) {
  const { data } = await client.get(`/sites/${id}/members`);
  return data;
}

/**
 * Add site member
 */
export async function addSiteMember(id, email, role) {
  const { data } = await client.post(`/sites/${id}/members`, { email, role });
  return data;
}

/**
 * Remove site member
 */
export async function removeSiteMember(id, userId) {
  const { data } = await client.delete(`/sites/${id}/members/${userId}`);
  return data;
}

/**
 * Add space to site
 */
export const addSpaceToSite = async (siteId, data) => {
  const response = await client.post(`/sites/${siteId}/spaces`, data);
  return response.data;
};

/**
 * Update space in site
 */
export const updateSpaceInSite = async (siteId, spaceId, data) => {
  const response = await client.put(`/sites/${siteId}/spaces/${spaceId}`, data);
  return response.data;
};

/**
 * Remove space from site
 */
export const removeSpaceFromSite = async (siteId, spaceId) => {
  const response = await client.delete(`/sites/${siteId}/spaces/${spaceId}`);
  return response.data;
};

/**
 * Reorder spaces in site
 */
export const reorderSpacesInSite = async (siteId, spaces) => {
  const response = await client.post(`/sites/${siteId}/spaces/reorder`, { spaces });
  return response.data;
};

export default {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  publishSite,
  unpublishSite,
  addSpaceToSite,
  updateSpaceInSite,
  removeSpaceFromSite,
  reorderSpacesInSite,
};
