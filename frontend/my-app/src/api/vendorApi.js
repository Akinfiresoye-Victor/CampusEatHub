import axiosInstance from './axiosInstance'

export const getVendorProducts = () => axiosInstance.get('/api/student/vendor/')
export const addVendorProduct = (data) => axiosInstance.post('/api/student/vendor/', data)
export const updateVendorProduct = (id, data) => axiosInstance.put(`/api/student/vendor/${id}/`, data)
export const toggleVendorProduct = (id) => axiosInstance.patch(`/api/student/vendor/${id}/toggle/`)
export const deleteVendorProduct = (id) => axiosInstance.delete(`/api/student/vendor/${id}/`)