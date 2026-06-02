import axios from 'axios'
import { getCsrfToken } from '../utils/csrf'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
})

// Attach CSRF token to every non-GET request
axiosInstance.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    config.headers['X-CSRFToken'] = getCsrfToken()
  }
  return config
})

// Redirect to login on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance