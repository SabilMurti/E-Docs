import client from './client';

/**
 * Get public space by slug
 */
export const getPublicSpace = async (slug) => {
  const response = await client.get(`/public/spaces/${slug}`);
  return response.data;
};

/**
 * Get pages for public space
 */
export const getPublicPages = async (slug) => {
  const response = await client.get(`/public/spaces/${slug}/pages`);
  return response.data;
};

/**
 * Get single public page
 */
export const getPublicPage = async (spaceSlug, pageSlug) => {
  const response = await client.get(`/public/spaces/${spaceSlug}/pages/${pageSlug}`);
  return response.data;
};

export default {
  getPublicSpace,
  getPublicPages,
  getPublicPage,
};
