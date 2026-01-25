import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import SEO from '../components/SEO';

function PaymentReturn() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Información de retorno genérica (caso multi-dispositivo / IP remota)
    const returnTo = params.get('return') || params.get('return_to') || null;
    const orderId = params.get('orderId');

    const timeout = setTimeout(async () => {
      // Si tenemos orderId, consultar estado real de la orden en el backend
      if (orderId) {
        try {
          const resp = await orderService.getById(orderId);
          const status = resp?.data?.status;

          if (status === 'paid' || status === 'completed') {
            navigate(`/payment-result?orderId=${orderId}&status=success`, { replace: true });
            return;
          }

          if (status === 'cancelled' || status === 'failed') {
            navigate(`/payment-result?orderId=${orderId}&status=failed`, { replace: true });
            return;
          }
        } catch (e) {
          // Si falla la consulta, continuar con el fallback
          console.error('Error consultando orden en PaymentReturn:', e);
        }
      }

      // Fallback original: redirigir a /orders (usando return_to cuando aplica)
      if (returnTo) {
        try {
          const target = `${returnTo.replace(/\/$/, '')}/orders`;
          window.location.replace(target);
          return;
        } catch (e) {
          // fall back to internal navigation
        }
      }
      navigate('/orders', { replace: true });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <>
      <SEO
        title="Procesando tu pago"
        description="Verificando el estado de tu pago y redirigiéndote a tus pedidos en Karell Premium."
        robots="noindex, nofollow"
      />
      <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem'
        }}></div>
        <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>Procesando tu pago...</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Redirigiendo a tus pedidos</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
}

export default PaymentReturn;
