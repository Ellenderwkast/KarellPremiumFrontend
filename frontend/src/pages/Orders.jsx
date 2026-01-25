// Quita ceros a la izquierda de un id string
function cleanOrderId(id) {
  if (typeof id === 'number') return id;
  return String(id || '').replace(/^0+/, '') || id;
}
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeDollarSign, Check, CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react';
import { orderService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import '../styles/orders.css';
import { formatCOPFromUnits } from '../utils/currency';
import { PAYMENT_REJECTED_TITLE, PAYMENT_REJECTED_BODY } from '../constants/paymentMessages';

function Orders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, type: 'success', order: null });

  const goToProductReviews = (productId, color) => {
    if (!productId) return;
    const colorQuery = color ? `?color=${encodeURIComponent(color)}` : '';
    navigate(`/products/${productId}${colorQuery}#reviews`);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getAll();
        setOrders(response.data);
        // Si venimos de redirect: ?payment=success|error|pending|cancelled
        const payment = searchParams.get('payment');
        const status = searchParams.get('status');
        const modalType = payment || status;
        
        if (modalType && response.data?.length) {
          // Tomar último pedido
          const last = response.data[0];
          const typeMap = {
            success: 'success',
            paid: 'success',
            error: 'error',
            declined: 'error',
            cancelled: 'cancelled',
            pending: 'pending',
            processing: 'processing',
            cash_delivery: 'cash'
          };
          const finalType = typeMap[modalType] || modalType;
          setModal({ open: true, type: finalType, order: last });
          
          // limpiar la query para evitar reabrir al recargar
          searchParams.delete('payment');
          searchParams.delete('status');
          setSearchParams(searchParams);
        }
      } catch (err) {
        setError('Error al cargar los pedidos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams, setSearchParams]);

  const getStatusBadge = status => {
    const statusMap = {
      pending: { label: 'Pendiente de pago', icon: <Clock aria-hidden="true" /> },
      paid: { label: 'Pagado', icon: <Check aria-hidden="true" /> },
      processing: { label: 'Procesando', icon: <Package aria-hidden="true" /> },
      shipped: { label: 'Enviado', icon: <Truck aria-hidden="true" /> },
      delivered: { label: 'Entregado', icon: <CheckCircle2 aria-hidden="true" /> },
      cancelled: { label: 'Cancelado', icon: <XCircle aria-hidden="true" /> }
    };
    return statusMap[status] || { label: status, icon: '' };
  };

  const getStatusClass = status => {
    return `status-${status}`;
  };

  if (loading) return <div className="loading">Cargando pedidos...</div>;
  if (error) return <div className="error">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="orders-empty">
        <div className="container">
          <h2>No tienes pedidos aún</h2>
          <p>Comienza a comprar en nuestra tienda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <button onClick={() => navigate('/')} className="btn-back">
            ← Volver al inicio
          </button>
          <h1>Mis pedidos</h1>
        </div>

        {modal.open && (
          <div className="modal-overlay" onClick={() => setModal({ ...modal, open: false })}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              {modal.type === 'success' && (
                <>
                  <h2>Pago exitoso</h2>
                  <p>Tu pedido se registró correctamente. Aquí tienes el resumen:</p>
                  {modal.order && (
                    <div className="modal-order-summary">
                      <p>
                        <strong>Pedido #</strong>
                        {cleanOrderId(modal.order.id || modal.order._id)}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {new Date(modal.order.createdAt).toLocaleString('es-ES')}
                      </p>
                      <p>
                        <strong>Envío:</strong> ${formatCOPFromUnits(modal.order.shippingCost || 0)}
                      </p>
                      <p>
                        <strong>Total:</strong> ${formatCOPFromUnits(modal.order.total)}
                      </p>
                      <div>
                        <h4>Productos</h4>
                        {(modal.order.items || []).map(it => (
                          <div
                            key={
                              `${it.product?.id || it.productId || it.title || 'item'}::${it.color || ''}`
                            }
                            className="order-item-detail"
                          >
                            <span>
                              {it.title || it.product?.name || 'Producto'} x {it.quantity}
                              {it.color && (
                                <span className="item-color-badge" style={{ marginLeft: '8px' }}>
                                  <span
                                    className="color-dot"
                                    style={{
                                      display: 'inline-block',
                                      width: '10px',
                                      height: '10px',
                                      verticalAlign: 'middle',
                                      border: '1px solid #ddd'
                                    }}
                                  ></span>
                                  {it.color}
                                </span>
                              )}
                            </span>
                            <span>${formatCOPFromUnits((it.price || 0) * (it.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="modal-actions">
                    {!auth.isAuthenticated && (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          const email = modal.order?.customerEmail || '';
                          const name = modal.order?.customerName || '';
                          setModal({ ...modal, open: false });
                          navigate(
                            `/create-account?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
                          );
                        }}
                      >
                        Crear cuenta
                      </button>
                    )}
                    <button className="btn-secondary" onClick={() => setModal({ ...modal, open: false })}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
              {modal.type === 'error' && (
                <>
                  <h2>
                    <XCircle aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    {PAYMENT_REJECTED_TITLE}
                  </h2>
                  <p>{PAYMENT_REJECTED_BODY}</p>
                  {modal.order && (
                    <div className="modal-order-summary">
                      <p><strong>Pedido #</strong>{cleanOrderId(modal.order.id || modal.order._id)}</p>
                      <p><strong>Estado:</strong> Rechazado</p>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => navigate('/checkout')}>
                      Volver a intentar
                    </button>
                    <button className="btn-secondary" onClick={() => setModal({ ...modal, open: false })}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
              {modal.type === 'cancelled' && (
                <>
                  <h2><XCircle aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />Pedido cancelado</h2>
                  <p>Tu pedido ha sido cancelado. Si deseas realizar una nueva compra, puedes volver a la tienda.</p>
                  {modal.order && (
                    <div className="modal-order-summary">
                      <p><strong>Pedido #</strong>{cleanOrderId(modal.order.id || modal.order._id)}</p>
                      <p><strong>Fecha:</strong> {new Date(modal.order.createdAt).toLocaleString('es-ES')}</p>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => navigate('/products')}>
                      Ver productos
                    </button>
                    <button className="btn-secondary" onClick={() => setModal({ ...modal, open: false })}>
                      Cerrar
                    </button>
                  </div>
                </>
              )}
              {modal.type === 'pending' && (
                <>
                  <h2><Clock aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />Pago pendiente</h2>
                  <p>Tu pedido está registrado y estamos esperando la confirmación del pago.</p>
                  {modal.order && (
                    <div className="modal-order-summary">
                      <p><strong>Pedido #</strong>{cleanOrderId(modal.order.id || modal.order._id)}</p>
                      <p><strong>Total:</strong> ${formatCOPFromUnits(modal.order.total)}</p>
                      <p><strong>Estado:</strong> Pendiente de pago</p>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => setModal({ ...modal, open: false })}>
                      Entendido
                    </button>
                  </div>
                </>
              )}
              {modal.type === 'processing' && (
                <>
                  <h2><Package aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />Pedido en proceso</h2>
                  <p>Tu pedido está siendo procesado. Te notificaremos cuando esté listo para envío.</p>
                  {modal.order && (
                    <div className="modal-order-summary">
                      <p><strong>Pedido #</strong>{cleanOrderId(modal.order.id || modal.order._id)}</p>
                      <p><strong>Estado:</strong> En proceso</p>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => setModal({ ...modal, open: false })}>
                      Entendido
                    </button>
                  </div>
                </>
              )}
              {modal.type === 'cash' && (
                <>
                  <h2><BadgeDollarSign aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />Pedido en curso</h2>
                  <p>
                    Has elegido pago contra entrega. Tu pedido está en curso y te contactaremos para coordinar la
                    entrega.
                  </p>
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => setModal({ ...modal, open: false })}>
                      Entendido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="orders-list">
          {orders.map(order => (
            <div
              key={
                order.id ||
                order._id ||
                `${order.customerEmail || 'guest'}::${new Date(order.createdAt).getTime()}`
              }
              className="order-card"
            >
              <div className="order-header">
                <div>
                  <h3>Pedido #{cleanOrderId(order.id || order._id)}</h3>
                  <p className="order-date">{new Date(order.createdAt).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  <span className="status-icon">{getStatusBadge(order.status).icon}</span>
                  <span className="status-label">{getStatusBadge(order.status).label}</span>
                </div>
              </div>

              <div className="order-items">
                <h4>Productos:</h4>
                {(order.items || []).map(item => (
                  <div
                    key={`${item.product?.id || item.productId || item.title || 'item'}::${item.color || ''}`}
                    className="order-item-detail"
                  >
                    <span>
                      {item.title || item.product?.name || 'Producto'} x {item.quantity}
                      {item.color && (
                        <span className="item-color-badge" style={{ marginLeft: '8px' }}>
                          <span
                            className="color-dot"
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: item.colorHex || '#ccc',
                              marginRight: '4px',
                              verticalAlign: 'middle',
                              border: '1px solid #ddd'
                            }}
                          ></span>
                          {item.color}
                        </span>
                      )}
                    </span>
                    <div className="order-item-actions">
                      <span>${formatCOPFromUnits((item.price || 0) * (item.quantity || 1))}</span>
                      {(item.product?.id || item.productId) && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => goToProductReviews(item.product?.id || item.productId, item.color)}
                        >
                          Calificar producto
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span className="order-shipping-cost">
                    Envío: <strong>${formatCOPFromUnits(order.shippingCost || 0)}</strong>
                  </span><br/>
                  Total: <strong>${formatCOPFromUnits(order.total || 0)}</strong>
                </div>
                <div className="order-shipping">
                  Envío a:{' '}
                  <strong>
                    {order.shippingAddress || 'No especificado'}
                    {order.shippingCity && `, ${order.shippingCity}`}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Orders;
