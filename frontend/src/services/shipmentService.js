import api from './api';

export const shipmentService = {
  // Listar todas las guías/envíos (admin)
  list: (params) => api.get('/shipments/admin', { params }),
  // Obtener detalles de un envío por orderId
  getByOrderId: (orderId) => api.get(`/shipments/order/${orderId}`),
  // Forzar creación de guía para una orden
  createGuide: (orderId) => api.post(`/shipments/admin/order/${orderId}/create-guide`),
  // Refrescar tracking manualmente
  refreshTracking: (orderId) => api.post(`/shipments/admin/order/${orderId}/refresh-tracking`),
  // Recalcular metadatos del shipment (declaredValue, weightKg, dimensionsCm)
  recalculate: (orderId, opts = {}) => api.post(`/shipments/admin/order/${orderId}/recalculate`, opts),
  // Actualizar estado del shipment (admin)
  updateStatus: (orderId, status) => api.patch(`/shipments/admin/order/${orderId}/status`, { status }),
  // Descargar/ver PDF de la guía
  getGuidePdfUrl: (orderId) => `${api.defaults.baseURL}/shipments/admin/order/${orderId}/guide-pdf`,
  downloadGuidePdf: (orderId) => api.get(`/shipments/admin/order/${orderId}/guide-pdf`, { responseType: 'arraybuffer' }),
  // Anular guía (admin)
  voidGuide: (orderId) => api.post(`/shipments/admin/order/${orderId}/void`)
};
