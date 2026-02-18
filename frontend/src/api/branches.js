import client from './client';

export const getBranches = async (siteId) => {
    const response = await client.get(`/sites/${siteId}/branches`);
    return response.data;
};

export const createBranch = async (siteId, data) => {
    const response = await client.post(`/sites/${siteId}/branches`, data);
    return response.data;
};

export const deleteBranch = async (siteId, branchId) => {
    const response = await client.delete(`/sites/${siteId}/branches/${branchId}`);
    return response.data;
};
