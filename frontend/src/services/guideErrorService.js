import api from './api';

export const guideErrorService = {
  list: (params) => api.get('/guide-errors', { params }),
  create: (data) => api.post('/guide-errors', data),
  update: (id, data) => api.put(`/guide-errors/${id}`, data),
  remove: (id) => api.delete(`/guide-errors/${id}`),
  toggleResolved: (id) => api.patch(`/guide-errors/${id}/toggle`)
};
