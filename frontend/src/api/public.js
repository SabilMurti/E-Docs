import client from './client';

/**
 * Get public site by identifier (UUID or slug)
 */
export const getPublicSite = async (identifier) => {
  const response = await client.get(`/public/sites/${identifier}`);
  return response.data;
};

/**
 * Get spaces for public site
 */
export const getPublicSiteSpaces = async (identifier) => {
  const response = await client.get(`/public/sites/${identifier}/spaces`);
  return response.data;
};

/**
 * Get single space in public site
 */
export const getPublicSiteSpace = async (identifier, spaceId) => {
  const response = await client.get(`/public/sites/${identifier}/spaces/${spaceId}`);
  return response.data;
};

/**
 * Get pages for a space in public site
 */
export const getPublicSitePages = async (identifier, spaceId) => {
  const response = await client.get(`/public/sites/${identifier}/spaces/${spaceId}/pages`);
  return response.data;
};

/**
 * Get single page in public site
 */
export const getPublicSitePage = async (identifier, spaceId, pageId) => {
  const response = await client.get(`/public/sites/${identifier}/spaces/${spaceId}/pages/${pageId}`);
  return response.data;
};

// Legacy exports for backward compatibility
export const getPublicSpace = async (slug) => {
  const response = await client.get(`/public/spaces/${slug}`);
  return response.data;
};

export const getPublicPages = async (slug) => {
  const response = await client.get(`/public/spaces/${slug}/pages`);
  return response.data;
};

export const getPublicPage = async (spaceSlug, pageSlug) => {
  const response = await client.get(`/public/spaces/${spaceSlug}/pages/${pageSlug}`);
  return response.data;
};

export default {
  getPublicSite,
  getPublicSiteSpaces,
  getPublicSiteSpace,
  getPublicSitePages,
  getPublicSitePage,
  getPublicSpace,
  getPublicPages,
  getPublicPage,
};
