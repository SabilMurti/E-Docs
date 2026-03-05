import { create } from 'zustand';
import * as sitesApi from '../api/sites';

// ─── Persist active branch per site in localStorage ──────────────────────────
const BRANCH_KEY = (siteSlug) => `edocs-branch-${siteSlug}`;

export function getSavedBranch(siteSlug) {
  try {
    return localStorage.getItem(BRANCH_KEY(siteSlug)) || 'main';
  } catch {
    return 'main';
  }
}

function saveBranch(siteSlug, branchName) {
  try {
    if (siteSlug) localStorage.setItem(BRANCH_KEY(siteSlug), branchName);
  } catch { /* ignore */ }
}

const useSiteStore = create((set, get) => ({
  sites: [],
  currentSite: null,
  branches: [],
  currentBranch: 'main',   // will be overwritten from localStorage on first siteSlug load
  currentSiteSlug: null,   // tracked so we know which key to use for localStorage
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
  publishSite: async (siteSlug) => {
    try {
      const response = await sitesApi.publishSite(siteSlug);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.slug === siteSlug ? updatedSite : s)),
        currentSite: state.currentSite?.slug === siteSlug ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite, publicUrl: response.public_url };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to publish' };
    }
  },

  // Unpublish site
  unpublishSite: async (siteSlug) => {
    try {
      const response = await sitesApi.unpublishSite(siteSlug);
      const updatedSite = response.data;
      set((state) => ({
        sites: state.sites.map((s) => (s.slug === siteSlug ? updatedSite : s)),
        currentSite: state.currentSite?.slug === siteSlug ? updatedSite : state.currentSite,
      }));
      return { success: true, data: updatedSite };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to unpublish' };
    }
  },

  // Clear current site
  clearCurrentSite: () => set({ currentSite: null, branches: [], currentBranch: 'main', currentSiteSlug: null }),

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

  // ─── Switch Branch (persists to localStorage per site) ───────────────────
  switchBranch: (branchName, siteSlug) => {
    // Persist to localStorage so it survives page refresh
    const slug = siteSlug || get().currentSiteSlug;
    saveBranch(slug, branchName);
    set({ currentBranch: branchName });
  },

  // ─── Initialize branch for a site (called when entering a site) ──────────
  // Reads from localStorage first, falls back to 'main'.
  // Does NOT reset to main if user was previously on a feature branch.
  initBranchForSite: (siteSlug) => {
    const saved = getSavedBranch(siteSlug);
    set({ currentBranch: saved, currentSiteSlug: siteSlug });
  },
}));

export default useSiteStore;
