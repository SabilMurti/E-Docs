import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Also persist to localStorage for the axios interceptor
        if (token) localStorage.setItem('token', token);
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },

      // Fetch current user
      fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          set({ 
            user: response.data || response, 
            token: token,
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // Only clear auth on 401 (truly unauthorized/expired token).
          // Network errors, CORS errors, or server errors (5xx) should NOT log the user out.
          const status = error?.response?.status;
          if (status === 401) {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
            localStorage.removeItem('token');
          } else {
            // Non-401 error (network/CORS/5xx): keep existing auth state, just stop loading
            set({ isLoading: false });
          }
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          // Still logout even if API fails
          console.error('Logout error:', error);
        }
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
        localStorage.removeItem('token');
      },

      // Check if authenticated
      checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token && !get().user) {
          get().fetchUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
