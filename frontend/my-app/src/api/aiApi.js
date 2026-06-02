import axiosInstance from './axiosInstance'

export const getMealRecommendation = (data) => axiosInstance.post('/api/student/ai/meal-recommender/', data)
export const askAdminAssistant = (question) => axiosInstance.post('/api/admin/ai/assistant/', { question })
export const askCafeteriaAssistant = (question) => axiosInstance.post('/api/cafeteria/ai/assistant/', { question })