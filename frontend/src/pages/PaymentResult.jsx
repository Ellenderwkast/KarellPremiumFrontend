import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService, paymentService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import '../styles/orders.css';
import { formatCOPFromUnits } from '../utils/currency';
import { PAYMENT_REJECTED_TITLE, PAYMENT_REJECTED_BODY } from '../constants/paymentMessages';

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status'); // success | error | cash
  const orderId = searchParams.get('orderId');
  const email = searchParams.get('email') || '';
  const auth = useAuthStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';

  // Build WhatsApp message with order details
  const buildWhatsAppMessage = useCallback(() => {
    const id = order?.id ? `#${String(order.id).slice(-6)}` : orderId ? `#${String(orderId).slice(-6)}` : '';
    const total = order?.total
      ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(Number(order.total || 0)))
      : '';
    const name = order?.customerName || '';
    const lines = [
      `Hola, ${name || 'equipo'}`, 
      `Quiero confirmar mi compra ${id}.`,
      total ? `Total: $${total} COP` : '',
      order?.items?.length
        ? `Productos: ${order.items.map(it => `${it.product?.name || it.productName || 'Producto'} x${it.quantity}`).join(', ')}`
        : '',
      `Gracias.`
    ].filter(Boolean);
    return lines.join('\n');
  }, [order, orderId]);

  // Memoize WhatsApp URL to prevent recalculations
  const whatsappUrl = useMemo(() => {
    if (!whatsappNumber) return null;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
  }, [whatsappNumber, buildWhatsAppMessage]);

  // Abrir WhatsApp automáticamente en pago exitoso
  useEffect(() => {
    if (status === 'success' && whatsappUrl) {
      // Dar un pequeño delay para que el usuario vea el modal y luego abrir WhatsApp
      const t = setTimeout(() => {
        try {
          window.open(whatsappUrl, '_blank');
        } catch (err) {
          // Ignore if WhatsApp fails to open
          console.warn('Could not open WhatsApp', err);
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [status, whatsappUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        // Invitado: usar endpoint especial con email
        if (orderId && email) {
          const resp = await orderService.getGuest(orderId, email);
          setOrder(resp.data);
          return;
        }

        // Usuario logueado sin email en la URL: fallback a getById
        if (orderId && auth.isAuthenticated) {
          const resp = await orderService.getById(orderId);
          setOrder(resp.data);
        }
      } catch (e) {
        console.error('Error cargando pedido en PaymentResult:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, email, auth.isAuthenticated]);

  // Si no hay status, mostrar error genérico
  if (!status) {
    return (
      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999
        }}
      >
        <div className="modal-card">
          <h2>Error</h2>
          <p>No se especificó el resultado del pago.</p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = n => formatCOPFromUnits(n);

  const handleRetryPayment = async () => {
    if (!orderId) {
      navigate('/checkout');
      return;
    }
    try {
      setRetryLoading(true);
      const resp = await paymentService.createWompi({
        orderId,
        redirectUrl: window.location.origin
      });
      const checkoutUrl = resp?.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        navigate('/checkout');
      }
    } catch (e) {
      console.error('Error reintentando pago Wompi:', e);
      navigate('/checkout');
    } finally {
      setRetryLoading(false);
    }
  };

  const Content = () => {
    if (status === 'success') {
      return (
        <>
          <div className="modal-header success">
            <div className="status-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <circle cx="12" cy="12" r="10" fill="#16A34A" />
                <path d="M8.5 12.5l2.5 2.5 4.5-5.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2>Pago exitoso</h2>
            </div>
          </div>
          <div className="modal-body">
            <p className="body-intro">Tu pedido se registró correctamente. Aquí tienes el resumen:</p>
            {order?.items?.length ? (
              <div className="modal-order-summary">
                <div className="summary-grid">
                  <div>
                    <p className="summary-label">Pedido</p>
                    <p className="summary-value">
                      #
                      {String(order.id || order._id)
                        .slice(-6)
                        .toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="summary-label">Fecha</p>
                    <p className="summary-value">{new Date(order.createdAt).toLocaleString('es-CO')}</p>
                  </div>
                  <div>
                    <p className="summary-label">Total pagado</p>
                    <p className="summary-value">${formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="summary-items">
                  <h4>Productos ({order.items.length})</h4>
                  {order.items.map(it => {
                    const productName =
                      it.product?.name ||
                      it.product?.title ||
                      it.productName ||
                      it.title ||
                      `Producto #${it.productId}`;
                    const itemPrice = it.price || 0;
                    const color = it.color || it.product?.color;
                    const colorHex = it.colorHex || it.product?.colorHex;
                    return (
                      <div
                        key={`${it.product?.id || it.productId || it.title || 'item'}::${color || ''}`}
                        className="order-item-detail"
                      >
                        <span>
                          {productName} x {it.quantity}
                          {color && (
                            <span className="item-color" style={{ marginLeft: '8px' }}>
                              <span
                                className="color-dot"
                                style={{
                                  display: 'inline-block',
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: colorHex || '#ccc',
                                  marginLeft: '4px',
                                  marginRight: '4px',
                                  verticalAlign: 'middle',
                                  border: '1px solid #ddd'
                                }}
                              ></span>
                              <span style={{ fontSize: '0.85em', color: '#666' }}>({color})</span>
                            </span>
                          )}
                        </span>
                        <span>${formatCurrency(itemPrice * it.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>
                  No pudimos cargar los productos del pedido en este momento. Revisa tu correo para ver el detalle
                  completo.
                </p>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Seguir comprando
            </button>
            {whatsappUrl && (
              <a className="btn-secondary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 12a9.5 9.5 0 1 1-17.2 5.8L3 22l4.3-1.2A9.5 9.5 0 1 1 21.5 12z" />
                  <path d="M8.8 9.8c.3-.6 1.1-1.5 1.7-1.4.5.1.9 1.3 1.1 1.7.2.4-.1.7-.4 1 .3.5 1.1 1.5 2.1 2 .6.3 1.1.2 1.4-.1.3-.3.6-.8.9-.7.3.1 1.9.9 2 .9.1 0 .1.3.1.6-.1.3-.5 1.3-1.3 1.6-.7.3-2 .3-3.5-.6-1.6-.9-3.6-3-4-3.5-.4-.6-1.1-1.7-.9-2.5z" />
                </svg>
                WhatsApp
              </a>
            )}
            {auth.isAuthenticated ? (
              <button className="btn-secondary" onClick={() => navigate('/orders')}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Ver pedido
              </button>
            ) : (
              <button
                className="btn-secondary"
                onClick={() =>
                  navigate(
                    `/create-account?email=${encodeURIComponent(order?.customerEmail || '')}&name=${encodeURIComponent(order?.customerName || '')}`
                  )
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Crear cuenta
              </button>
            )}
          </div>
        </>
      );
    }
    if (status === 'cash') {
      return (
        <>
          <div className="modal-header info">
            <div className="status-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <circle cx="12" cy="12" r="10" fill="#0EA5E9" />
                <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2>Pedido en curso</h2>
            </div>
          </div>
          <div className="modal-body">
            <p className="body-intro">
              Has elegido pago contra entrega. Tu pedido está en curso y te contactaremos para coordinar la entrega.
            </p>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Entendido
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="modal-header error">
          <div className="status-icon error" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28">
              <circle cx="12" cy="12" r="11" fill="#DC2626" />
              <g
                transform="translate(12,12)"
                stroke="#fff"
                strokeWidth="2.8"
                strokeLinecap="round"
              >
                <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5" />
                <line x1="4.5" y1="-4.5" x2="-4.5" y2="4.5" />
              </g>
            </svg>
          </div>
          <div className="modal-title-text">
            <h2>{PAYMENT_REJECTED_TITLE}</h2>
          </div>
          <button
            type="button"
            className="payment-modal-close"
            aria-label="Cerrar"
            onClick={() => navigate('/')}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="body-intro">{PAYMENT_REJECTED_BODY}</p>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleRetryPayment} disabled={retryLoading}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {retryLoading ? 'Redirigiendo a Wompi...' : 'Reintentar pago'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Ir al inicio
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999
      }}
    >
      <div className="modal-card fancy" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        {loading ? <p>Cargando...</p> : <Content />}
      </div>
    </div>
  );
}
