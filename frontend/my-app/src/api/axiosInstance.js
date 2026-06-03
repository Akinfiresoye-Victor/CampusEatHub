import axios from 'axios';
import { getCsrfToken } from '../utils/csrf';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // CRITICAL — sends sessionid cookie cross-origin
});

// Request interceptor — attach CSRF token to all non-GET requests
axiosInstance.interceptors.request.use((config) => {
  if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRFToken'] = getCsrfToken();
  }
  return config;
});

// Response interceptor — handle session expiry
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login/register page
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;