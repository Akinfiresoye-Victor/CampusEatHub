import axiosInstance from './axiosInstance'

export const getCafeteriaMenu = () => axiosInstance.get('/api/cafeteria/menu/')
export const addMenuItem = (data) => axiosInstance.post('/api/cafeteria/menu/', data)
export const updateMenuItem = (id, data) => axiosInstance.put(`/api/cafeteria/menu/${id}/`, data)
export const toggleMenuItem = (id) => axiosInstance.patch(`/api/cafeteria/menu/${id}/toggle/`)
export const deleteMenuItem = (id) => axiosInstance.delete(`/api/cafeteria/menu/${id}/`)
export const getCafeteriaOrders = (status) => axiosInstance.get('/api/cafeteria/orders/', { params: status ? { status } : {} })
export const updateOrderStatus = (id, status) => axiosInstance.patch(`/api/cafeteria/orders/${id}/status/`, { status })