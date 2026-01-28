import api from './api';

export const shippingStatusService = {
  list: () => api.get('/shipping-statuses'),
  create: (data) => api.post('/shipping-statuses', data),
  update: (id, data) => api.put(`/shipping-statuses/${id}`, data),
  remove: (id) => api.delete(`/shipping-statuses/${id}`),
  toggleActive: (id) => api.patch(`/shipping-statuses/${id}/toggle`)
};
