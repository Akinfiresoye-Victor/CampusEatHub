import axiosInstance from './axiosInstance'

export const getVendorProducts = () => axiosInstance.get('/api/student/vendor/menu/')
export const addVendorProduct = (data) => axiosInstance.post('/api/student/vendor/menu/', data)
export const updateVendorProduct = (id, data) => axiosInstance.put(`/api/student/vendor/menu/${id}/`, data)
export const toggleVendorProduct = (id) => axiosInstance.patch(`/api/student/vendor/menu/${id}/`)
export const deleteVendorProduct = (id) => axiosInstance.delete(`/api/student/vendor/menu/${id}/`)