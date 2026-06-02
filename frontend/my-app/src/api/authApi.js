import axiosInstance from './axiosInstance'

export const register = (data) => {
  const url = data.role === 'student'
    ? '/api/auth/register_student/'
    : '/api/auth/register_cafeteria/'
  return axiosInstance.post(url, data)
}
export const login = (data) => axiosInstance.post('/api/auth/login_user/', data)
export const logout = () => axiosInstance.post('/api/auth/logout_user/')
export const getMe = () => axiosInstance.get('/api/auth/me/')