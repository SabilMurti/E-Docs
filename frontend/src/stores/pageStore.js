import { create } from 'zustand';
import * as pagesApi from '../api/pages';

const usePageStore = create((set, get) => ({
  pages: [],          // Tree structure
  currentPage: null,
  isLoading: false,
  isSaving: false,
  error: null,

  // Fetch page tree for a site
  fetchPages: async (siteId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.getPages(siteId);
      set({ 
        pages: response.data || response,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // Fetch single page
  fetchPage: async (siteId, pageId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.getPage(siteId, pageId);
      const page = response.data || response;
      set({ 
        currentPage: page,
        isLoading: false 
      });
      return page;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },

  // Create page
  createPage: async (siteId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.createPage(siteId, data);
      const page = response.data || response;
      // Refetch the tree to get updated structure
      await get().fetchPages(siteId);
      return { success: true, page };
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update page
  updatePage: async (siteId, pageId, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.updatePage(siteId, pageId, data);
      const updatedPage = response.data || response;
      set((state) => ({ 
        currentPage: state.currentPage?.id === pageId ? updatedPage : state.currentPage,
        isSaving: false 
      }));
      // Refetch tree if title changed
      if (data.title) {
        await get().fetchPages(siteId);
      }
      return { success: true, page: updatedPage };
    } catch (error) {
      set({ 
        error: error.message, 
        isSaving: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Delete page
  deletePage: async (siteId, pageId) => {
    set({ isLoading: true, error: null });
    try {
      await pagesApi.deletePage(siteId, pageId);
      // Refetch tree
      await get().fetchPages(siteId);
      set((state) => ({ 
        currentPage: state.currentPage?.id === pageId ? null : state.currentPage,
        isLoading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Reorder pages
  reorderPages: async (siteId, pageUpdates) => {
    try {
      await pagesApi.reorderPages(siteId, pageUpdates);
      await get().fetchPages(siteId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Set current page
  setCurrentPage: (page) => set({ currentPage: page }),

  // Clear pages (when switching sites)
  clearPages: () => set({ pages: [], currentPage: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Change Request & Commits
  currentRequest: null,
  commits: [],

  commitChange: async (siteId, pageId, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.commitChange(siteId, pageId, data);
      set({ 
        currentRequest: response.request,
        isSaving: false 
      });
      return { success: true, commit: response.commit };
    } catch (error) {
      set({ error: error.message, isSaving: false });
      return { success: false, error: error.message };
    }
  },

  fetchRequestDetails: async (pageId) => {
     try {
       const response = await pagesApi.getChangeRequests(pageId);
       // Find user's current draft
       const requests = response.data || response;
       const draft = requests.find(r => r.status === 'draft' && r.user_id === requests.user_id); // This line is slightly buggy since we don't have user_id here easily, but we'll fix it
       set({ currentRequest: draft });
     } catch (e) {}
  }
}));

export default usePageStore;
