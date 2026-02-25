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
 * Get branches for site
 */
export const getBranches = async (siteId) => {
  const response = await client.get(`/sites/${siteId}/branches`);
  return response.data;
};

/**
 * Create branch in site
 */
export const createBranch = async (siteId, data) => {
  const response = await client.post(`/sites/${siteId}/branches`, data);
  return response.data;
};

/**
 * Delete branch from site
 */
export const deleteBranch = async (siteId, branchId) => {
  const response = await client.delete(`/sites/${siteId}/branches/${branchId}`);
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
  getSiteMembers,
  addSiteMember,
  removeSiteMember,
  getBranches,
  createBranch,
  deleteBranch,
};
