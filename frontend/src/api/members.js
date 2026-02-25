import client from './client';

/**
 * Get members of a site
 */
export const getMembers = async (siteSlug) => {
  const response = await client.get(`/sites/${siteSlug}/members`);
  return response.data;
};

/**
 * Invite a member to a site
 */
export const inviteMember = async (siteSlug, data) => {
  const response = await client.post(`/sites/${siteSlug}/members`, data);
  return response.data;
};

/**
 * Update member role
 */
export const updateMember = async (siteSlug, memberId, data) => {
  const response = await client.put(`/sites/${siteSlug}/members/${memberId}`, data);
  return response.data;
};

/**
 * Remove a member from site
 */
export const removeMember = async (siteSlug, memberId) => {
  const response = await client.delete(`/sites/${siteSlug}/members/${memberId}`);
  return response.data;
};

export default {
  getMembers,
  inviteMember,
  updateMember,
  removeMember,
};
