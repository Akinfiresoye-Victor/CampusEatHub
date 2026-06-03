import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  spending: null,
  isLoading: false,
  error: '',

  fetchOrders: async () => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get('/api/student/orders/');
      if (res.data.success) {
        set({ orders: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load orders.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load orders.', isLoading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get(`/api/student/orders/${id}/`);
      if (res.data.success) {
        set({ currentOrder: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Order not found.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load order.', isLoading: false });
    }
  },

  checkout: async (deliveryType) => {
    try {
      const res = await axiosInstance.post('/api/student/orders/checkout/', { delivery_type: deliveryType });
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Checkout failed. Please try again.' };
    }
  },

  fetchSpending: async () => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get('/api/student/orders/spending/');
      if (res.data.success) {
        set({ spending: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load spending.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load spending data.', isLoading: false });
    }
  },
}));
