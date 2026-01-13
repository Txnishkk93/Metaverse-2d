import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Add full URL for backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: (username: string, password: string, type: 'user' | 'admin' = 'user') =>
    api.post('/signup', { username, password, type }),
  
  signin: (username: string, password: string) =>
    api.post('/signin', { username, password }),
};

// Avatar API
export const avatarAPI = {
  getAll: () => api.get('/avatars'),
  
  updateUserMetadata: (avatarId: string) =>
    api.post('/user/metadata', { avatarId }),
};

// Space API
export const spaceAPI = {
  getAll: () => api.get('/space/all'),
  
  getById: (spaceId: string) => api.get(`/space/${spaceId}`),
  
  create: (name: string, dimensions: string, mapId: string) =>
    api.post('/space', { name, dimensions, mapId }),
  
  delete: (spaceId: string) => api.delete(`/space/${spaceId}`),
};

export default api;