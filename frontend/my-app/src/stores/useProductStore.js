import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useProductStore = create((set) => ({
  products: [],
  cafeterias: [],
  cafeteriaMenu: [],
  isLoading: false,
  error: '',

  fetchProducts: async () => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get('/api/products/');
      if (res.data.success) {
        set({ products: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load products.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load products. Please try again.', isLoading: false });
    }
  },

  fetchCafeterias: async () => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get('/api/cafeterias/');
      if (res.data.success) {
        set({ cafeterias: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load cafeterias.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load cafeterias. Please try again.', isLoading: false });
    }
  },

  fetchCafeteriaMenu: async (cafeteriaId) => {
    set({ isLoading: true, error: '' });
    try {
      const res = await axiosInstance.get(`/api/cafeterias/${cafeteriaId}/menu/`);
      if (res.data.success) {
        set({ cafeteriaMenu: res.data.data, isLoading: false });
      } else {
        set({ error: res.data.error || 'Failed to load menu.', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to load menu. Please try again.', isLoading: false });
    }
  },
}));
