import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../authStore';
import * as authApi from '../../api/auth';

// Mock API module
vi.mock('../../api/auth', () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true, error: null });
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initially has default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('fetchUser sets user on success', async () => {
    localStorage.setItem('token', 'test-token');
    const mockUser = { id: 1, name: 'Test User' };
    authApi.getMe.mockResolvedValue({ data: mockUser });

    await useAuthStore.getState().fetchUser();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('fetchUser handles error', async () => {
    localStorage.setItem('token', 'test-token');
    authApi.getMe.mockRejectedValue(new Error('Failed'));

    await useAuthStore.getState().fetchUser();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('logout cleans up state', async () => {
    // Setup logged in state
    localStorage.setItem('token', 'old-token');
    useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(authApi.logout).toHaveBeenCalled();
  });
});
