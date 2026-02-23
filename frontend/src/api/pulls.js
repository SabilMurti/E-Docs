import client from './client';

// Pull Requests
export const getPullRequests = async (siteId, status = 'open') => {
  const { data } = await client.get(`/sites/${siteId}/pulls`, { params: { status } });
  return data;
};

export const createPullRequest = async (siteId, payload) => {
  const { data } = await client.post(`/sites/${siteId}/pulls`, payload);
  return data;
};

export const getPullRequest = async (siteId, prId) => {
  const { data } = await client.get(`/sites/${siteId}/pulls/${prId}`);
  return data;
};

export const updatePullRequest = async (siteId, prId, payload) => {
  const { data } = await client.put(`/sites/${siteId}/pulls/${prId}`, payload);
  return data;
};

export const mergePullRequest = async (siteId, prId) => {
  const { data } = await client.post(`/sites/${siteId}/pulls/${prId}/merge`);
  return data;
};

export const closePullRequest = async (siteId, prId) => {
  const { data } = await client.post(`/sites/${siteId}/pulls/${prId}/close`);
  return data;
};

export const deletePullRequest = async (siteId, prId) => {
  const { data } = await client.delete(`/sites/${siteId}/pulls/${prId}`);
  return data;
};

export const resolvePullRequestConflicts = async (siteId, prId, resolutions) => {
  const { data } = await client.post(`/sites/${siteId}/pulls/${prId}/resolve`, { resolutions });
  return data;
};

export const compareBranches = async (siteId, sourceBranchId, targetBranchId) => {
  const { data } = await client.get(`/sites/${siteId}/pulls/compare`, {
    params: { source_branch_id: sourceBranchId, target_branch_id: targetBranchId }
  });
  return data;
};

// PR Reviews
export const getReviews = async (siteId, prId) => {
  const { data } = await client.get(`/sites/${siteId}/pulls/${prId}/reviews`);
  return data;
};

export const submitReview = async (siteId, prId, payload) => {
  const { data } = await client.post(`/sites/${siteId}/pulls/${prId}/reviews`, payload);
  return data;
};

// Commits
export const getCommits = async (siteId, branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {};
  const { data } = await client.get(`/sites/${siteId}/commits`, { params });
  return data;
};

export const createCommit = async (siteId, payload) => {
  const { data } = await client.post(`/sites/${siteId}/commits`, payload);
  return data;
};

export const getCommit = async (siteId, commitId) => {
  const { data } = await client.get(`/sites/${siteId}/commits/${commitId}`);
  return data;
};

// Get commits filtered to a specific page (for page history view)
export const getPageCommits = async (siteId, pageId) => {
  const { data } = await client.get(`/sites/${siteId}/commits`, {
    params: { page_id: pageId },
  });
  return data;
};

// Member Role
export const updateMemberRole = async (siteId, userId, role) => {
  const { data } = await client.put(`/sites/${siteId}/members/${userId}`, { role });
  return data;
};
