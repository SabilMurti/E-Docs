import client from './client';

export const getNotifications = async () => {
  const response = await client.get('/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await client.get('/notifications/count');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await client.post(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await client.post('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
