// API para publicaciones del blog — usa el cliente `api` que inyecta Authorization
import api from '../../services/api';

export const fetchPosts = () => api.get('/blog');
export const fetchPost = (id) => api.get(`/blog/${id}`);
export const createPost = (data) => api.post('/blog', data);
export const updatePost = (id, data) => api.put(`/blog/${id}`, data);
export const deletePost = (id) => api.delete(`/blog/${id}`);
export const fetchAdminPosts = () => api.get('/blog/admin');
