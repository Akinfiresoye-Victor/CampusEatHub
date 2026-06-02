import axiosInstance from './axiosInstance'

export const getOverview = () => axiosInstance.get('/api/admin/overview/')
export const getUsers = (page = 1) => axiosInstance.get('/api/admin/users/', { params: { page } })
export const getAdminOrders = (status, page = 1) => axiosInstance.get('/api/admin/orders/', { params: { ...(status && { status }), page } })