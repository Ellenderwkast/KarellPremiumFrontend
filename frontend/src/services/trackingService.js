import api from './api';

export const trackingService = {
  list: (params) => api.get('/trackings', { params }),
  getEvents: (id) => api.get(`/trackings/${id}/events`),
  refresh: (id) => api.post(`/trackings/${id}/refresh`)
};
