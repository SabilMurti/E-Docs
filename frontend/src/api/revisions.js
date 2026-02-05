import client from './client';

/**
 * Get revisions for a page
 */
export const getRevisions = async (spaceId, pageId) => {
  const response = await client.get(`/spaces/${spaceId}/pages/${pageId}/revisions`);
  return response.data;
};

/**
 * Get a specific revision
 */
export const getRevision = async (spaceId, pageId, revisionId) => {
  const response = await client.get(`/spaces/${spaceId}/pages/${pageId}/revisions/${revisionId}`);
  return response.data;
};

/**
 * Restore a revision
 */
export const restoreRevision = async (spaceId, pageId, revisionId) => {
  const response = await client.post(`/spaces/${spaceId}/pages/${pageId}/revisions/${revisionId}/restore`);
  return response.data;
};

/**
 * Search within a space
 */
export const search = async (spaceId, query) => {
  const response = await client.get(`/spaces/${spaceId}/search`, { params: { q: query } });
  return response.data;
};

export default {
  getRevisions,
  getRevision,
  restoreRevision,
  search,
};
