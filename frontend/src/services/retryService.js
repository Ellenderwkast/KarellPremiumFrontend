import api from './api';

export const retryService = {
  list: (params) => api.get('/retries', { params }),
  update: (id, data) => api.put(`/retries/${id}`, data),
  retry: (id) => api.post(`/retries/${id}/retry`),
  remove: (id) => api.delete(`/retries/${id}`),
  toggleSuccess: (id) => api.patch(`/retries/${id}/toggle`)
};
