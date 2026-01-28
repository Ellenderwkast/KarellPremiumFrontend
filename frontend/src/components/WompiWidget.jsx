import { useEffect } from 'react';

const isDev = import.meta.env.DEV;

function WompiWidget({
  publicKey,
  amount,
  currency = 'COP',
  reference,
  customerEmail,
  paymentMethod,
  onSuccess,
  onError,
  onClose,
  onOpened
}) {
  useEffect(() => {
    // Verificar si el script ya está cargado
    if (window.WidgetCheckout) {
      initializeWidget();
      return;
    }

    // Cargar script de Wompi si no existe
    const existingScript = document.querySelector('script[src*="checkout.wompi.co/widget.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeWidget);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = initializeWidget;
    script.onerror = () => {
      console.error('Error cargando el script de Wompi');
      if (onError) onError({ message: 'Error cargando widget de pago' });
    };

    document.body.appendChild(script);

    function initializeWidget() {
      if (!window.WidgetCheckout) {
        console.error('WidgetCheckout no disponible');
        return;
      }

      if (isDev) {
        console.log('Inicializando widget de Wompi con:', {
          publicKey,
          amount,
          reference,
          paymentMethod
        });
      }

      // Configuración mínima del widget según docs de Wompi
      const config = {
        currency: String(currency || 'COP'),
        amountInCents: Number(amount) || 0,
        reference: String(reference || ''),
        publicKey: String(publicKey || '')
        // No establecer redirectUrl: algunos entornos (IP/LAN) causan 422.
        // Usamos callbacks onSuccess/onError para navegar.
      };

      try {
        const checkout = new window.WidgetCheckout(config);

        // Abrir widget (el widget se abre en su propia ventana modal de Wompi)
        checkout.open(result => {
          if (isDev) console.log('Resultado del widget:', result);
          const transaction = result?.transaction;

          if (!transaction) {
            if (isDev) console.log('No hay información de transacción');
            if (onClose) onClose();
            return;
          }

          if (transaction.status === 'APPROVED') {
            if (isDev) console.log('Pago aprobado');
            if (onSuccess) onSuccess(transaction);
          } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
            if (isDev) console.log('Pago rechazado o error');
            if (result?.error) {
              console.warn('Detalles de error Wompi:', result.error);
            }
            if (onError) onError(transaction);
          } else {
            if (isDev) console.log('Estado:', transaction.status);
            if (onClose) onClose();
          }
        });
        // Notificar que el widget abrió para ocultar loaders propios
        if (onOpened) onOpened();
      } catch (error) {
        console.error('Error inicializando widget:', error);
        if (onError) onError({ message: error.message });
      }
    }

    return () => {
      // Cleanup si es necesario
    };
  }, [publicKey, amount, currency, reference, paymentMethod, customerEmail, onSuccess, onError, onClose]);

  // No renderizar nada - el widget de Wompi se encarga de mostrar su propia UI
  return null;
}

export default WompiWidget;
