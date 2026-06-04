import axiosInstance from './axiosInstance';

export const registerStudent = (data) => axiosInstance.post('/api/auth/register_student/', data);
export const registerCafeteria = (data) => axiosInstance.post('/api/auth/register_cafeteria/', data);
export const login = (data) => axiosInstance.post('/api/auth/login_user/', data);
export const logout = () => axiosInstance.post('/api/auth/logout_user/');
export const getMe = () => axiosInstance.get('/api/auth/me/');