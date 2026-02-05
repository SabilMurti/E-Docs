import { create } from 'zustand';
import * as pagesApi from '../api/pages';

const usePageStore = create((set, get) => ({
  pages: [],          // Tree structure
  currentPage: null,
  isLoading: false,
  isSaving: false,
  error: null,

  // Fetch page tree for a space
  fetchPages: async (spaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.getPages(spaceId);
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
  fetchPage: async (spaceId, pageId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.getPage(spaceId, pageId);
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
  createPage: async (spaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pagesApi.createPage(spaceId, data);
      const page = response.data || response;
      // Refetch the tree to get updated structure
      await get().fetchPages(spaceId);
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
  updatePage: async (spaceId, pageId, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.updatePage(spaceId, pageId, data);
      const updatedPage = response.data || response;
      set((state) => ({ 
        currentPage: state.currentPage?.id === pageId ? updatedPage : state.currentPage,
        isSaving: false 
      }));
      // Refetch tree if title changed
      if (data.title) {
        await get().fetchPages(spaceId);
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
  deletePage: async (spaceId, pageId) => {
    set({ isLoading: true, error: null });
    try {
      await pagesApi.deletePage(spaceId, pageId);
      // Refetch tree
      await get().fetchPages(spaceId);
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
  reorderPages: async (spaceId, pageUpdates) => {
    try {
      await pagesApi.reorderPages(spaceId, pageUpdates);
      await get().fetchPages(spaceId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Set current page
  setCurrentPage: (page) => set({ currentPage: page }),

  // Clear pages (when switching spaces)
  clearPages: () => set({ pages: [], currentPage: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default usePageStore;
