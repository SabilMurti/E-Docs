import { create } from 'zustand';
import * as pagesApi from '../api/pages';
import useAuthStore from './authStore';

const usePageStore = create((set, get) => ({
  pages: [],          // Tree structure
  currentPage: null,
  isLoading: false,
  isSaving: false,
  error: null,

  // Fetch page tree for a site
  fetchPages: async (siteId, branchName = 'main', silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      // Pass branch as query param
      const response = await pagesApi.getPages(siteId, { branch: branchName });
      const data = response.data || response;
      set((state) => ({ 
        pages: data,
        ...(!silent && { isLoading: false })
      }));
      return data;
    } catch (error) {
      if (!silent) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
      }
      return null;
    }
  },

  // Fetch single page
  fetchPage: async (siteId, pageId, params = {}) => {
    // If we're fetching a completely different page, clear the current one out
    // so the UI knows to show a loading state instead of the old page's content
    const current = get().currentPage;
    const isNewPage = current && current.slug !== pageId && current.id !== pageId;

    set({ 
      isLoading: true, 
      error: null,
      ...(isNewPage ? { currentPage: null } : {})
    });
    try {
      const response = await pagesApi.getPage(siteId, pageId, params);
      const page = response.data || response;
      set({ 
        currentPage: page,
        isLoading: false 
      });
      return page;
    } catch (error) {
      set({ 
        error: error.response?.status === 404 ? 'Page not found' : error.message,
        currentPage: null,
        isLoading: false 
      });
      return null;
    }
  },

  // Create page
  createPage: async (siteId, data, branchName = 'main', silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const payload = { ...data, branch: branchName };
      const response = await pagesApi.createPage(siteId, payload);
      const page = response.data || response;
      // Refetch the tree to get updated structure silently
      await get().fetchPages(siteId, branchName, true);
      if (!silent) set({ isLoading: false });
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
  updatePage: async (siteId, pageId, data, branchName = 'main') => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.updatePage(siteId, pageId, data);
      const updatedPage = response.data || response;
      set((state) => ({ 
        currentPage: state.currentPage?.slug === pageId ? updatedPage : state.currentPage,
        isSaving: false 
      }));
      // Refetch tree if title changed — pass current branch silently!
      if (data.title) {
        await get().fetchPages(siteId, branchName, true);
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
  deletePage: async (siteId, pageId, branchName = 'main') => {
    set({ isSaving: true, error: null }); // Use isSaving instead of isLoading to not unmount modals
    try {
      await pagesApi.deletePage(siteId, pageId);
      // Refetch tree silently!
      await get().fetchPages(siteId, branchName, true);
      set((state) => ({ 
        currentPage: state.currentPage?.slug === pageId ? null : state.currentPage,
        isSaving: false 
      }));
      return { success: true };
    } catch (error) {
      set({ 
        error: error.message, 
        isSaving: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Reorder pages
  reorderPages: async (siteId, pageUpdates, branchName = 'main') => {
    try {
      await pagesApi.reorderPages(siteId, pageUpdates);
      await get().fetchPages(siteId, branchName, true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Duplicate page
  duplicatePage: async (siteId, pageSlug, branchName = 'main') => {
    set({ isSaving: true, error: null }); // Avoid global isLoading
    try {
      const response = await pagesApi.duplicatePage(siteId, pageSlug);
      const newPage = response.data;
      // Refresh tree silhouette silently
      await get().fetchPages(siteId, branchName, true);
      set({ isSaving: false });
      return { success: true, page: newPage };
    } catch (error) {
      set({ error: error.message, isSaving: false });
      return { success: false, error: error.message };
    }
  },

  // Set current page
  setCurrentPage: (page) => set({ currentPage: page }),

  // Clear pages (when switching sites)
  clearPages: () => set({ pages: [], currentPage: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Save draft (lightweight save without commit)
  saveDraft: async (siteId, pageId, data, params = {}) => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.updatePage(siteId, pageId, data, params);

      // Guard: only use the response as page data if it looks like a real page object.
      // If server returns {success:true} or similar, keep the existing currentPage.
      const updatedPage = (response?.id || response?.data?.id)
        ? (response.id ? response : response.data)
        : null;

      set((state) => ({
        currentPage: updatedPage && state.currentPage?.slug === pageId
          ? { ...state.currentPage, ...updatedPage }  // merge to preserve local fields
          : state.currentPage,
        isSaving: false,
      }));
      return { success: true, page: updatedPage || response };
    } catch (error) {
      set({ error: error.message, isSaving: false });
      return { success: false, error: error.message };
    }
  },

  // Change Request & Commits
  currentRequest: null,
  commits: [],

  commitChange: async (siteId, pageId, data, params = {}) => {
    set({ isSaving: true, error: null });
    try {
      const response = await pagesApi.commitChange(siteId, pageId, data, params);
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
       const currentUser = useAuthStore.getState().user;
       const draft = requests.find(r => r.status === 'draft' && r.author_id === currentUser?.id);
       set({ currentRequest: draft });
     } catch (e) {}
  }
}));

export default usePageStore;
