import axiosInstance from './axiosInstance'

export const getCart = () => axiosInstance.get('/api/student/cart/')
export const addToCart = (data) => axiosInstance.post('/api/student/cart/add/', data)
export const updateCartItem = (id, data) => axiosInstance.put(`/api/student/cart/update/${id}/`, data)
export const removeCartItem = (id) => axiosInstance.delete(`/api/student/cart/remove/${id}/`)
export const clearCart = () => axiosInstance.delete('/api/student/cart/clear/')