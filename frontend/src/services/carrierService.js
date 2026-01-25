import api from './api';

export const carrierService = {
  list: () => api.get('/carriers'),
  create: (data) => api.post('/carriers', data),
  update: (id, data) => api.put(`/carriers/${id}`, data),
  remove: (id) => api.delete(`/carriers/${id}`),
  toggleActive: (id) => api.patch(`/carriers/${id}/toggle`)
};
