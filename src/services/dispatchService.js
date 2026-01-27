import api from './api';

export const dispatchService = {
  // Envía una solicitud de recogida al backend. El backend se encargará
  // de invocar el método SOAP/servicio correspondiente de Coordinadora.
  requestPickup: (data) => api.post('/dispatch/recogida', data),
  // Endpoints auxiliares (listing, consulta) pueden implementarse si es necesario
  listDispatches: (params) => api.get('/dispatch', { params }),
  consultDispatch: (id) => api.get(`/dispatch/${id}`)
  ,
  // Consultar seguimiento de recogida
  seguimientoPickup: (data) => api.post('/dispatch/seguimiento', data)
};
