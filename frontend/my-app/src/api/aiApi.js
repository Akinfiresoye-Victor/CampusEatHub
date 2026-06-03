import axiosInstance from './axiosInstance';

export const getMealRecommendation = (data) => axiosInstance.post('/api/student/ai/meal-recommender/', data);
export const askCafeteriaAssistant = (question) => axiosInstance.post('/api/cafeteria/ai/assistant/', { question });