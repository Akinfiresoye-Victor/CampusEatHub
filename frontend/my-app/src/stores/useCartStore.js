import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useCartStore = create((set, get) => ({
  items: [],
  sellerName: '',
  sellerLockError: '',
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/api/student/cart/');
      if (res.data.success) {
        const mappedItems = (res.data.cart_items || []).map((item) => ({
          ...item,
          id: item.cart_item_id,
          name: item.product_name,
          image: item.image_url,
        }));
        set({
          items: mappedItems,
          sellerName: res.data.seller_info?.seller_id ? res.data.seller_info.seller_id : '',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      const res = await axiosInstance.post('/api/student/cart/', { product_id: productId, quantity });
      if (res.data.success) {
        // Refresh cart after adding
        get().fetchCart();
        return { success: true };
      } else {
        const error = res.data.error || 'Failed to add item.';
        if (res.data.error) {
          set({ sellerLockError: error });
        }
        return { success: false, error };
      }
    } catch (err) {
      const error = err.response?.data?.error || 'Failed to add item.';
      set({ sellerLockError: error });
      return { success: false, error };
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      const res = await axiosInstance.put(`/api/student/cart/${itemId}/`, { quantity });
      if (res.data.success) {
        set((state) => ({
          items: state.items.map((i) => i.id === itemId ? { ...i, quantity } : i),
        }));
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Update failed.' };
    }
  },

  removeItem: async (itemId) => {
    try {
      await axiosInstance.delete(`/api/student/cart/${itemId}/`);
      set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  clearCart: async () => {
    try {
      await axiosInstance.delete('/api/student/cart/');
      set({ items: [], sellerName: '', sellerLockError: '' });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  clearSellerLockError: () => set({ sellerLockError: '' }),
}));
