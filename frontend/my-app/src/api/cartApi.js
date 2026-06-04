import axiosInstance from './axiosInstance'

export const getCart = () => axiosInstance.get('/api/student/cart/')
export const addToCart = (data) => axiosInstance.post('/api/student/cart/', data)
export const updateCartItem = (id, data) => axiosInstance.put(`/api/student/cart/${id}/`, data)
export const removeCartItem = (id) => axiosInstance.delete(`/api/student/cart/${id}/`)
export const clearCart = () => axiosInstance.delete('/api/student/cart/')