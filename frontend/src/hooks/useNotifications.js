import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/notifications');
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : data?.notifications || [];
      setNotifications(list);
      
      const count = typeof data?.unreadCount === 'number'
        ? data.unreadCount
        : list.filter((n) => !n.isRead && !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      // optimistic update
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (patchErr) {
        // fallback to PUT
        await api.put(`/notifications/${id}/read`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // rollback or refetch
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);

      try {
        await api.patch('/notifications/read-all');
      } catch (patchErr) {
        await api.put('/notifications/read-all');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
