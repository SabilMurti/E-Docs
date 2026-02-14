import { create } from 'zustand';
import * as notificationsApi from '../api/notifications';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationsApi.getNotifications();
      set({ 
        notifications: response.data || response, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      set({ unreadCount: response.count });
    } catch (error) {}
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {}
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read_at: new Date().toISOString() })),
        unreadCount: 0
      }));
    } catch (error) {}
  }
}));

export default useNotificationStore;
