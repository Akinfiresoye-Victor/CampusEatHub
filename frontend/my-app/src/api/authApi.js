import axiosInstance from './axiosInstance'

export const register = (data) => axiosInstance.post('/api/auth/register_user/', data)
export const login = (data) => axiosInstance.post('/api/auth/login_user', data)
export const logout = () => axiosInstance.post('/api/auth/logout_user/')
export const getMe = () => axiosInstance.get('/api/auth/me/')