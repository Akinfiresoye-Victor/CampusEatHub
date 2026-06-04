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
        const mappedOrders = (res.data.orders || []).map((order) => ({
          ...order,
          seller_name: order.seller_full_name,
          total: order.total_amount,
        }));
        set({ orders: mappedOrders, isLoading: false });
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
      if (res.data.success && res.data.order) {
        const order = res.data.order;
        const mappedOrder = {
          ...order,
          seller_name: order.seller_full_name,
          total: order.total_amount,
          items: (order.items || []).map((item, index) => ({
            ...item,
            id: item.id || index,
            name: item.product_name,
            price: Number(item.price_at_time),
          })),
        };
        set({ currentOrder: mappedOrder, isLoading: false });
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
        return { success: true, data: res.data.order };
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
        set({ spending: { total_spent: res.data.total_spent, total_orders: res.data.total_orders, per_seller_breakdown: res.data.per_seller_breakdown }, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load spending.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load spending data.', isLoading: false });
    }
  },
}));
