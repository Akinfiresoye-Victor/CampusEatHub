import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  // Called once on app startup to restore session
  checkSession: async () => {
    try {
      const res = await axiosInstance.get('/api/auth/me/');
      if (res.data.success) {
        set({ user: res.data.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  // Called after successful login or register
  setUser: (userData) => set({ user: userData }),

  // Called on logout button click
  logout: async () => {
    try {
      await axiosInstance.post('/api/auth/logout/');
    } finally {
      set({ user: null });
      window.location.href = '/login';
    }
  },
}));
