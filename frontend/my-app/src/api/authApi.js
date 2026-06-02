import axiosInstance from './axiosInstance'

export const register = (data) => axiosInstance.post('/api/auth/register_user/', data)
export const login = (data) => axiosInstance.post('/api/auth/login_user/', data)
export const logout = () => axiosInstance.post('/api/auth/logout_user/')
export const getStudent = () => axiosInstance.get('/api/student/get_student_data/')
export const getCafeteria = () => axiosInstance.get('/api/cafeteria/get_cafeteria_data/')