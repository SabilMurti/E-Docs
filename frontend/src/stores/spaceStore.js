import { create } from 'zustand';
import * as spacesApi from '../api/spaces';

const useSpaceStore = create((set, get) => ({
  spaces: [],
  currentSpace: null,
  isLoading: false,
  error: null,

  // Fetch all spaces
  fetchSpaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await spacesApi.getSpaces();
      set({ 
        spaces: response.data || response,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // Fetch single space
  fetchSpace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await spacesApi.getSpace(id);
      const space = response.data || response;
      set({ 
        currentSpace: space,
        isLoading: false 
      });
      return space;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },

  // Create space
  createSpace: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await spacesApi.createSpace(data);
      const space = response.data || response;
      set((state) => ({ 
        spaces: [...state.spaces, space],
        isLoading: false 
      }));
      return { success: true, space };
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update space
  updateSpace: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await spacesApi.updateSpace(id, data);
      const updatedSpace = response.data || response;
      set((state) => ({ 
        spaces: state.spaces.map(s => s.id === id ? updatedSpace : s),
        currentSpace: state.currentSpace?.id === id ? updatedSpace : state.currentSpace,
        isLoading: false 
      }));
      return { success: true, space: updatedSpace };
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Delete space
  deleteSpace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await spacesApi.deleteSpace(id);
      set((state) => ({ 
        spaces: state.spaces.filter(s => s.id !== id),
        currentSpace: state.currentSpace?.id === id ? null : state.currentSpace,
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

  // Publish space
  publishSpace: async (id) => {
    try {
      const response = await spacesApi.publishSpace(id);
      const updatedSpace = response.data || response;
      set((state) => ({ 
        spaces: state.spaces.map(s => s.id === id ? updatedSpace : s),
        currentSpace: state.currentSpace?.id === id ? updatedSpace : state.currentSpace,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Unpublish space
  unpublishSpace: async (id) => {
    try {
      const response = await spacesApi.unpublishSpace(id);
      const updatedSpace = response.data || response;
      set((state) => ({ 
        spaces: state.spaces.map(s => s.id === id ? updatedSpace : s),
        currentSpace: state.currentSpace?.id === id ? updatedSpace : state.currentSpace,
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Set current space
  setCurrentSpace: (space) => set({ currentSpace: space }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useSpaceStore;
