import axiosInstance from './axiosInstance'

export const checkout = (data) => axiosInstance.post('/api/student/orders/checkout/', data)
export const getOrders = () => axiosInstance.get('/api/student/orders/')
export const getOrder = (id) => axiosInstance.get(`/api/student/orders/${id}/`)
export const getSpending = () => axiosInstance.get('/api/student/orders/spending/')