import client from './client';

/**
 * Get members of a space
 */
export const getMembers = async (spaceId) => {
  const response = await client.get(`/spaces/${spaceId}/members`);
  return response.data;
};

/**
 * Invite a member to a space
 */
export const inviteMember = async (spaceId, data) => {
  const response = await client.post(`/spaces/${spaceId}/members`, data);
  return response.data;
};

/**
 * Update member role
 */
export const updateMember = async (spaceId, memberId, data) => {
  const response = await client.put(`/spaces/${spaceId}/members/${memberId}`, data);
  return response.data;
};

/**
 * Remove a member from space
 */
export const removeMember = async (spaceId, memberId) => {
  const response = await client.delete(`/spaces/${spaceId}/members/${memberId}`);
  return response.data;
};

/**
 * Accept an invitation
 */
export const acceptInvite = async (spaceId, token) => {
  const response = await client.post(`/spaces/${spaceId}/invites/${token}/accept`);
  return response.data;
};

export default {
  getMembers,
  inviteMember,
  updateMember,
  removeMember,
  acceptInvite,
};
