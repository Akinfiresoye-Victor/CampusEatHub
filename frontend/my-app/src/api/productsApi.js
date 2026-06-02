import axiosInstance from './axiosInstance'

export const getProducts = () => axiosInstance.get('/api/products/')
export const getCafeterias = () => axiosInstance.get('/api/cafeterias/')
export const getCafeteriaMenu = (id) => axiosInstance.get(`/api/cafeterias/${id}/menu/`)