import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useCafeteriaStore = create((set) => ({
  menu: [],
  orders: [],
  isLoading: false,
  error: '',

  fetchMenu: async () => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get('/api/cafeteria/menu/');
      if (res.data.success) {
        set({ menu: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load menu.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load menu.', isLoading: false });
    }
  },

  addMenuItem: async (formData) => {
    try {
      const res = await axiosInstance.post('/api/cafeteria/menu/', formData);
      if (res.data.success) {
        set((state) => ({ menu: [...state.menu, res.data.data] }));
        return { success: true, data: res.data.data };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add item.' };
    }
  },

  updateMenuItem: async (id, formData) => {
    try {
      const res = await axiosInstance.put(`/api/cafeteria/menu/${id}/`, formData);
      if (res.data.success) {
        set((state) => ({ menu: state.menu.map((i) => i.id === id ? res.data.data : i) }));
        return { success: true, data: res.data.data };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update item.' };
    }
  },

  toggleMenuItem: async (id) => {
    // Optimistic update
    set((state) => ({
      menu: state.menu.map((i) => i.id === id ? { ...i, available: !i.available } : i),
    }));
    try {
      const res = await axiosInstance.patch(`/api/cafeteria/menu/${id}/toggle/`);
      if (!res.data.success) {
        // Revert on failure
        set((state) => ({
          menu: state.menu.map((i) => i.id === id ? { ...i, available: !i.available } : i),
        }));
        return { success: false, error: res.data.error };
      }
      return { success: true };
    } catch {
      // Revert on error
      set((state) => ({
        menu: state.menu.map((i) => i.id === id ? { ...i, available: !i.available } : i),
      }));
      return { success: false };
    }
  },

  deleteMenuItem: async (id) => {
    try {
      await axiosInstance.delete(`/api/cafeteria/menu/${id}/`);
      set((state) => ({ menu: state.menu.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete item.' };
    }
  },

  fetchOrders: async (statusFilter) => {
    set({ isLoading: true, error: '' });
    try {
      const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await axiosInstance.get('/api/cafeteria/orders/', { params });
      if (res.data.success) {
        set({ orders: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load orders.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load orders.', isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await axiosInstance.patch(`/api/cafeteria/orders/${orderId}/status/`, { status });
      if (res.data.success) {
        set((state) => ({
          orders: state.orders.map((o) => o.id === orderId ? { ...o, status } : o),
        }));
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update status.' };
    }
  },
}));
