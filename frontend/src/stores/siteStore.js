import { create } from 'zustand';
import * as sitesApi from '../api/sites';

const useSiteStore = create((set, get) => ({
  sites: [],
  currentSite: null,
  branches: [],
  currentBranch: 'main',
  isLoading: false,
  error: null,

  // Fetch all sites
  fetchSites: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await sitesApi.getSites();
      set({ sites: response.data || [], isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch sites';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Fetch single site
  fetchSite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sitesApi.getSite(id);
      set({ currentSite: response.data, isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch site';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Create site
  createSite: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sitesApi.createSite(data);
      const newSite = response.data;
      set((state) => ({
        sites: [newSite, ...state.sites],
        currentSite: newSite,
        isLoading: false,
      }));
      return { success: true, data: newSite };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create site';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Update site
  updateSite: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sitesApi.updateSite(id, data);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === id ? updatedSite : s)),
        currentSite: state.currentSite?.id === id ? updatedSite : state.currentSite,
        isLoading: false,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update site';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Delete site
  deleteSite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await sitesApi.deleteSite(id);
      set((state) => ({
        sites: state.sites.filter((s) => s.id !== id),
        currentSite: state.currentSite?.id === id ? null : state.currentSite,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete site';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Publish site
  publishSite: async (id) => {
    try {
      const response = await sitesApi.publishSite(id);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === id ? updatedSite : s)),
        currentSite: state.currentSite?.id === id ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite, publicUrl: response.public_url };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to publish' };
    }
  },

  // Unpublish site
  unpublishSite: async (id) => {
    try {
      const response = await sitesApi.unpublishSite(id);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === id ? updatedSite : s)),
        currentSite: state.currentSite?.id === id ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to unpublish' };
    }
  },

  // Add space to site
  addSpace: async (siteId, data) => {
    try {
      const response = await sitesApi.addSpaceToSite(siteId, data);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === siteId ? updatedSite : s)),
        currentSite: state.currentSite?.id === siteId ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add space' };
    }
  },

  // Update space in site
  updateSpace: async (siteId, spaceId, data) => {
    try {
      const response = await sitesApi.updateSpaceInSite(siteId, spaceId, data);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === siteId ? updatedSite : s)),
        currentSite: state.currentSite?.id === siteId ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update space' };
    }
  },

  // Remove space from site
  removeSpace: async (siteId, spaceId) => {
    try {
      const response = await sitesApi.removeSpaceFromSite(siteId, spaceId);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === siteId ? updatedSite : s)),
        currentSite: state.currentSite?.id === siteId ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove space' };
    }
  },

  // Reorder spaces
  reorderSpaces: async (siteId, spaces) => {
    try {
      const response = await sitesApi.reorderSpacesInSite(siteId, spaces);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.id === siteId ? updatedSite : s)),
        currentSite: state.currentSite?.id === siteId ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to reorder' };
    }
  },

  // Clear current site
  clearCurrentSite: () => set({ currentSite: null, branches: [], currentBranch: 'main' }),

  // --- BRANCHES ---

  // Fetch branches
  fetchBranches: async (siteId) => {
    try {
      const response = await sitesApi.getBranches(siteId);
      set({ branches: response.data || [] });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create branch
  createBranch: async (siteId, data) => {
    try {
      const response = await sitesApi.createBranch(siteId, data);
      set(state => ({
        branches: [...state.branches, response.data]
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Delete branch
  deleteBranch: async (siteId, branchId) => {
    try {
      await sitesApi.deleteBranch(siteId, branchId);
      set(state => ({
        branches: state.branches.filter(b => b.id !== branchId)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Switch Branch (UI state only, pages fetch depends on this)
  switchBranch: (branchName) => {
    set({ currentBranch: branchName });
  }
}));

export default useSiteStore;
