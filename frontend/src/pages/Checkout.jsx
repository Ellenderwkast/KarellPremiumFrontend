import { useEffect, useMemo, useState, useRef } from 'react';

// Componente reutilizable para inputs
function InputField({ label, id, name, value, onChange, error, wrapperStyle, wrapperClassName, ...props }) {
  return (
    <div className={wrapperClassName ? `form-group ${wrapperClassName}` : 'form-group'} style={wrapperStyle}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={error ? 'invalid' : ''}
        {...props}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

// Componente reutilizable para selects
function SelectField({ label, id, name, value, onChange, error, options, ...props }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={error ? 'invalid' : ''}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { orderService, paymentService, productService, shippingService, API_URL } from '../services/api';
import '../styles/checkout.css';
import { IconCart, IconBox, IconCard } from '../components/CheckoutIcons';
import { departments, citiesByDepartment } from '../data/colombiaCities';
import SEO from '../components/SEO';

// Mapa de códigos DANE por ciudad y departamento basado en datos locales
// Se usa `ciudadesDaneFull.json` como fuente de verdad en el frontend.
import daneCities from '../data/ciudadesDaneFull.json';

// Arreglar problemas de codificación mojibake (p. ej. "UbalÃ¡" -> "Ubalá").
// Técnica: reinterpretar la cadena como Latin1 y decodificarla correctamente a UTF-8.
function fixEncoding(s) {
  try {
    // eslint-disable-next-line no-undef
    return decodeURIComponent(escape(String(s)));
  } catch (err) {
    return s;
  }
}

// Versión corregida de los datos DANE usada localmente en el frontend
// `ciudadesDaneFull.json` expone campos { codigo, nombre }.
// Los adaptamos a la forma { codigo, ciudad, departamento } esperada por el resto del código.
const fixedShippingRates = (daneCities || []).map(r => ({
  ...r,
  ciudad: fixEncoding(r.nombre),
  departamento: ''
}));

  // Utilidad para obtener el código DANE de una ciudad/departamento
function getDaneCode(city, department) {
  if (!city || !department) return '';
  const normalizeStr = (s = '') =>
    String(s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2019']/g, '')
      // remove punctuation (commas, periods, parentheses, etc.) to match variants like "Bogotá, D.C." vs "Bogotá D.C."
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');

  const nc = normalizeStr(city);
  const nd = normalizeStr(department);

  // Primera búsqueda exacta (case/acentos-insensitive)
  let entry = fixedShippingRates.find(r => normalizeStr(r.ciudad) === nc && normalizeStr(r.departamento) === nd);
  // Fallback: buscar solo por ciudad (algunas fuentes tienen departamento diferente o vacío)
  if (!entry) {
    // Preferir coincidencias donde la ciudad coincide y el departamento también coincide
    entry = fixedShippingRates.find(r => normalizeStr(r.ciudad) === nc && normalizeStr(r.departamento) === nd);
  }
  // Si no encontramos con departamento coincidente, manejar casos especiales antes de caer en cualquier ciudad homónima
  if (!entry) {
    // Caso especial: usuarios pueden escribir "Santiago" o "Santiago de Cali" para referirse a Cali (Valle del Cauca).
    // Evitamos devolver el 'Santiago' de Norte de Santander al preferir la entrada 'Cali' cuando el departamento es Valle del Cauca.
    if (nd === 'valle del cauca' && (nc === 'santiago' || nc.includes('santiago') && nc.includes('cali'))) {
      entry = fixedShippingRates.find(r => normalizeStr(r.ciudad) === 'cali' && normalizeStr(r.departamento) === nd);
    }
  }
  // Fallback genérico: buscar por ciudad sin chequear departamento
  if (!entry) {
    entry = fixedShippingRates.find(r => normalizeStr(r.ciudad) === nc);
  }
  // Fallback 2: buscar por inclusión (p.ej. 'bogota' vs 'bogota, d.c.')
  if (!entry) {
    entry = fixedShippingRates.find(r => normalizeStr(r.ciudad).startsWith(nc) || nc.startsWith(normalizeStr(r.ciudad)));
  }

  let codigo = entry?.codigo || '';
  // Si el código es de 5 dígitos, convertir a 8 dígitos (rellenar con ceros a la derecha)
  if (/^\d{5}$/.test(codigo)) {
    codigo = codigo + '000';
  }
  // Si el código es de menos de 8 dígitos, rellenar con ceros a la derecha
  if (/^\d{1,7}$/.test(codigo)) {
    codigo = codigo.padEnd(8, '0');
  }
  // Si el código es de más de 8 dígitos, recortar
  if (codigo.length > 8) {
    codigo = codigo.slice(0, 8);
  }
  return codigo;
}
import { useAuthStore } from '../store/authStore';

function Checkout() {
  // Estado para mostrar el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  /* ======================
     STORES Y NAVEGACIÓN
  ====================== */
  const auth = useAuthStore()
  const { items, clearCart } = useCartStore()
  const navigate = useNavigate()

  /* ======================
     ESTADOS
  ====================== */
  const [successMsg, setSuccessMsg] = useState('')
  const successMsgRef = useRef('')

  const [formData, setFormData] = useState({
    shippingAddress: '',
    neighborhood: '',
    department: '',
    city: '',
    shippingDaneCode: '',
    name: auth.user?.name || '',
    email: auth.user?.email || '',
    phone: auth.user?.phone || '',
    paymentMethod: 'cash_delivery',
    cardNumber: '',
    cardType: '',
    cardName: '',
    cardExpiry: '',
    cardCVC: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState(null)
  const [quotedCity, setQuotedCity] = useState('')
  const [shippingCost, setShippingCost] = useState(null)
  const [shippingDeliveryDays, setShippingDeliveryDays] = useState(null)
  const [shippingRawQuote, setShippingRawQuote] = useState(null)

  const [fieldErrors, setFieldErrors] = useState({})

  // Estado para validación inmediata de COD (null = unknown, true = allowed, false = blocked)
  const [codAllowed, setCodAllowed] = useState(null);
  const [codMessage, setCodMessage] = useState('');

  const [cardBrand, setCardBrand] = useState('')
  const [cardValid, setCardValid] = useState(null)
  const [expiryValid, setExpiryValid] = useState(null)
  const [cvvValid, setCvvValid] = useState(null)

  /* ======================
     EFECTOS
  ====================== */

  // Mostrar modal cuando hay mensaje de éxito
  useEffect(() => {
    if (successMsg) {
      successMsgRef.current = successMsg
      setShowSuccessModal(true)
    }
  }, [successMsg])

  // (Eliminada redirección automática, ahora el usuario controla el cierre del modal)

  // Si se cambia a otra ciudad o departamento, limpiar el método de pago si estaba forzado.
  // Forzar contraentrega si Valle del Cauca y Cali
  useEffect(() => {
    const department = formData.department?.trim().toLowerCase();
    const cityRaw = formData.city || '';
    const normalizeCityName = s =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019']/g, '')
        .replace(/\s+/g, ' ');
    const cityContainsCali = s => /\bcali\b/.test(normalizeCityName(s));

    if (department === 'valle del cauca' && cityContainsCali(cityRaw)) {
      if (formData.paymentMethod !== 'cash_delivery') {
        setFormData(prev => ({ ...prev, paymentMethod: 'cash_delivery' }));
      }
    }
  }, [formData.department, formData.city]);
  // (Eliminada variable department no usada)
  // ...existing code...

  // Items simplificados para cotización (backend maneja compatibilidad precio en pesos vs miles)
  const quoteItems = useMemo(() => {
    return (items || []).map(it => ({
      productId: it.id,
      quantity: Number(it.quantity || 1),
      price: Number(it.price || 0)
    }))
  }, [items])

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
  // ...existing code...
  const selectedCity = (formData.city || '').trim();
  // Comparación robusta: ignora mayúsculas/minúsculas y espacios
  const normalize = str => (str || '').trim().toLowerCase();
  // Normaliza y elimina diacríticos (acentos) para comparaciones robustas
  const normalizeDiacritics = s =>
    String(s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2019']/g, '')
      .replace(/\s+/g, ' ');
  const normalizeCityName = s => normalizeDiacritics(s);
  const cityContainsCali = s => /\bcali\b/.test(normalizeCityName(s));
  const hasValidShippingQuote =
    !!selectedCity &&
    normalize(quotedCity) === normalize(selectedCity) &&
    !shippingLoading &&
    !shippingError &&
    (
      (cityContainsCali(selectedCity) && normalize(formData.department) === 'valle del cauca')
      || (Number.isFinite(Number(shippingCost)) && Number(shippingCost) >= 0)
    );

  const finalTotal = subtotal + (hasValidShippingQuote ? Number(shippingCost) : 0)

  // Cotizar envío al seleccionar ciudad o cambiar el carrito
  // Lógica robusta de cotización/envío
  useEffect(() => {
    const city = (formData.city || '').trim().toLowerCase();
    const department = (formData.department || '').trim().toLowerCase();
    // Si es Cali y Valle del Cauca, NO cotizar con Coordinadora y mostrar $8.000 fijo
    if (cityContainsCali(city) && department === 'valle del cauca') {
      setShippingLoading(false);
      setShippingError(null);
      // Guardar la ciudad seleccionada como quotedCity para que la comparación
      // normalize(quotedCity) === normalize(selectedCity) funcione (p.ej. 'Santiago de Cali')
      setQuotedCity(formData.city || city);
      setShippingCost(8000);
      setShippingDeliveryDays(null);
      return;
    }

    // ...lógica original de cotización coordinadora...
    let cancelled = false;
    setShippingLoading(true);
    setShippingError(null);
    setQuotedCity('');
    setShippingCost(null);
    setShippingDeliveryDays(null);

    // Validación previa
    const errores = [];
    if (!city) errores.push('La ciudad de destino es obligatoria.');
    if (!department) errores.push('El departamento es obligatorio.');
    if (!Array.isArray(items) || items.length === 0) errores.push('El carrito está vacío.');
    items.forEach((item, idx) => {
      if (!item.quantity || item.quantity <= 0) errores.push(`Cantidad inválida en el producto #${idx + 1}`);
      if (!item.price || item.price <= 0) errores.push(`Precio inválida en el producto #${idx + 1}`);
    });

    if (errores.length > 0) {
      setShippingLoading(false);
      setShippingError(errores.join(' '));
      setShippingCost(null);
      setShippingDeliveryDays(null);
      setQuotedCity(city);
      return;
    }

    const t = setTimeout(async () => {
      try {
        // Mapeo de datos para Coordinadora
        // Determinar código DANE destino: preferir `shippingDaneCode` calculado
        const destinoCode = formData.shippingDaneCode || getDaneCode(formData.city, formData.department) || (import.meta.env.VITE_COORD_DEFAULT_DEST || '11001000');

        const cotizacionPayload = {
          nit: import.meta.env.VITE_COORD_NIT || '1087204978',
          div: import.meta.env.VITE_COORD_DIV || '00',
          cuenta: import.meta.env.VITE_COORD_CUENTA || '03',
          producto: import.meta.env.VITE_COORD_PRODUCTO || '0',
          origen: import.meta.env.VITE_COORD_ORIGEN || '76001000',
          destino: destinoCode,
          valoracion: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          nivel_servicio: [],
          detalle: items.map(item => ({
            ubl: 0,
            alto: item.alto || item.attributes?.alto || item.attributes?.height || 10,
            ancho: item.ancho || item.attributes?.ancho || item.attributes?.width || 10,
            largo: item.largo || item.attributes?.largo || item.attributes?.length || 10,
            peso: item.peso || item.attributes?.peso || item.attributes?.weight || 0.5,
            unidades: item.quantity,
            // Otros datos relevantes para Coordinadora
            declaredValue: item.attributes?.declaredValue || item.price || 10000,
            coordinadoraType: item.attributes?.coordinadoraType || 'mercancia'
          })),
          apikey: import.meta.env.VITE_COORD_APIKEY || 'a733a8fa-8fff-410b-a0b4-c49e658d06cb',
          clave: import.meta.env.VITE_COORD_CLAVE || 'rG1nP2eZ7rY7qW5q'
        };

          const resp = await shippingService.cotizarCoordinadora(cotizacionPayload);
          const result = resp.data?.resultado?.Cotizador_cotizarResult || resp.data?.resultado;
          if (!cancelled && result) {
            setShippingCost(Number(result.flete_total));
            setShippingDeliveryDays(result.dias_entrega ?? null);
            setQuotedCity(city);
            // Guardar la respuesta cruda de la cotización para reenviarla al crear la orden
            setShippingRawQuote(resp.data || result || null);
            // Persistir el código DANE usado para la cotización en el formulario.
            // Esto asegura que al confirmar la orden usemos el mismo DANE
            // que produjo la cotización y no dependamos solo de nombres de ciudad.
            setFormData(prev => ({ ...prev, shippingDaneCode: destinoCode }));
          }
      } catch (e) {
        if (!cancelled) {
            const apiMessage = e?.response?.data?.error || e?.response?.data?.message;
            // Normalizar mensajes de error sensibles/técnicos a mensajes amigables
            function friendlyMessage(err, fallback) {
              if (!err) return fallback;
              const low = String(err).toLowerCase();
              // Caso específico: error del cotizador (SIFA / mod_cotizador) que devuelve
              // "Error, para cotizaciones, no pueden haber valores en 0 (SIFA) para Flete Total".
              // Ese mensaje es técnico y confuso para el usuario; mapearlo a uno más amable.
              if (low.includes('para cotizaciones') && (low.includes('no pueden') || low.includes('sifa') || low.includes('mod_cotizador'))) {
                return 'No tenemos servicio para esta zona, por favor escoge otra cercana.';
              }
              // Errores de servidor genéricos
              if (low.includes('request failed with status code 500') || low.includes('internal server error') || low.includes('server error')) {
                return 'Error en el servicio de cotización. Por favor intenta de nuevo más tarde.';
              }
              // Errores de red
              if (low.includes('network error') || low.includes('timeout') || low.includes('eai_again') || low.includes('enotfound')) {
                return 'No se pudo conectar con el servicio de cotización. Verifica tu conexión e intenta nuevamente.';
              }
              // Mensajes ya amables (en español) mantenemos
              if (/\b(error|no se pudo|no existe|no encontrado|invalid|invalido|fall[oó]n)\b/i.test(String(err))) return String(err);
              // Dejar mensajes muy largos o técnicos como fallback genérico
              return fallback;
            }

            const fallback = `No se pudo cotizar el envío para ${city}.`; 
            setShippingError(friendlyMessage(apiMessage || e?.message, fallback));
          setShippingCost(null);
          setShippingDeliveryDays(null);
          setQuotedCity(city);
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [formData.city, formData.department, items]);

  // Fuerza un pequeño reflow/repaint cuando cambian elementos clave del checkout
  // Esto ayuda a estabilizar la colocación de botones que a veces se desacomodan
  // en actualizaciones dinámicas (evita que el usuario tenga que recargar la página).
  useEffect(() => {
    try {
      const el = document.querySelector('.checkout-summary-actions') || document.querySelector('.checkout-summary');
      if (el) {
        // forzar lectura de layout
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        // solicitud de frame para asegurar repaint
        requestAnimationFrame(() => {
          // dispatch resize para forzar recálculo por algunos componentes
          window.dispatchEvent(new Event('resize'));
        });
      }
    } catch (e) {
      // no bloquear si ocurre un error
      // console.debug('Reflow guard:', e)
    }
  }, [items.length, loading, shippingLoading, formData.paymentMethod, formData.city]);

  // Validación automática de COD: si el método actual es 'cash_delivery' y cambia la ciudad/departamento,
  // validar inmediatamente contra el backend para cubrir el caso en que el método venga preseleccionado.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (String(formData.paymentMethod) !== 'cash_delivery') return;
        const dane = formData.shippingDaneCode || getDaneCode(formData.city, formData.department) || '';
        if (!dane) {
          // No bloquear UX si no hay DANE todavía, pero dejar el estado como unknown
          setCodAllowed(null);
          setCodMessage('');
          return;
        }
        setCodMessage('Validando disponibilidad de contra entrega...');
        const url = `${API_URL.replace(/\/$/, '')}/coordinadora/validate-cod`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityDane: dane, carrier: 'coordinadora' })
        });
        const json = await resp.json();
        if (cancelled) return;
        if (json && json.allowed === false) {
          setCodAllowed(false);
          setCodMessage(json.message || 'El pago contraentrega no está disponible para tu ciudad elige otro metodo de pago');
        } else {
          setCodAllowed(true);
          setCodMessage('');
        }
      } catch (err) {
        console.warn('auto validate-cod failed', err);
        setCodAllowed(null);
        setCodMessage('');
      }
    })();
    return () => { cancelled = true; };
  }, [formData.city, formData.department, formData.shippingDaneCode, formData.paymentMethod]);

  const handleChange = (e) => {
    const { name, value } = e.target
    // Si se cambia ciudad o departamento, invalidar la comprobación previa de COD
    if (name === 'city' || name === 'department') {
      setCodAllowed(null);
      setCodMessage('');
    }
    // Si el usuario cambia el método de pago y selecciona Contra entrega,
    // realizar una validación inmediata contra el backend para ofrecer feedback instantáneo.
    if (name === 'paymentMethod') {
      // Si selecciona contra entrega, validar; si cambia a otro método limpiar estado
      if (String(value) === 'cash_delivery') {
        (async () => {
          try {
            const dane = formData.shippingDaneCode || getDaneCode(formData.city, formData.department) || '';
            if (!dane) {
              setCodAllowed(false);
              setCodMessage('No se pudo determinar el código DANE para validar contra entrega.');
            } else {
              const url = `${API_URL.replace(/\/$/, '')}/coordinadora/validate-cod`;
              const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cityDane: dane, carrier: 'coordinadora' })
              });
              const json = await resp.json();
                if (json && json.allowed === false) {
                setCodAllowed(false);
                setCodMessage(json.message || 'El pago contraentrega no está disponible para tu ciudad elige otro metodo de pago');
              } else {
                setCodAllowed(true);
                setCodMessage('');
              }
            }
          } catch (err) {
            console.warn('validate-cod onChange failed, allowing temporary fallback', err);
            setCodAllowed(null);
            setCodMessage('');
          }
        })();
      } else {
        setCodAllowed(null);
        setCodMessage('');
      }
    }
    if (name === 'department') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        city: '',
        shippingDaneCode: ''
      }))
    } else if (name === 'city') {
      // Cuando la ciudad cambia, invalidar la validación COD
      setCodAllowed(null);
      setCodMessage('');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        shippingDaneCode: getDaneCode(value, prev.department)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedCity) {
      setError('La ciudad es obligatoria para cotizar y confirmar el pedido.')
      return
    }

    if (!hasValidShippingQuote) {
      if (shippingLoading || quotedCity !== selectedCity) {
        setError('Espera un momento mientras cotizamos el envío para la ciudad seleccionada.')
      } else {
        setError('No hay una cotización de envío válida para la ciudad seleccionada.')
      }
      return
    }

    // Si es Cali, forzar costo y días de envío
    let shippingCostToSend = shippingCost;
    let shippingDaysToSend = shippingDeliveryDays;
    if (cityContainsCali(selectedCity) && (formData.department || '').trim().toLowerCase() === 'valle del cauca') {
      shippingCostToSend = 8000;
      shippingDaysToSend = 1;
    }

    // LOG: mostrar valores clave antes de enviar
    // Usar primero el `shippingDaneCode` ya calculado/seleccionado en el formulario
    // Esto evita falsos negativos cuando la cotización usó un código calculado
    // pero `getDaneCode` no encuentra una coincidencia textual exacta
    // Normalizar y limpiar el código DANE: usar el valor persistido o calcularlo,
    // luego eliminar espacios y cualquier caracter no numérico.
    const rawDane = formData.shippingDaneCode || getDaneCode(formData.city, formData.department);
    const computedDane = String(rawDane || '').trim().replace(/\D/g, '');
    if (import.meta.env.DEV) {
      console.log('[CHECKOUT] Enviando pedido. city:', formData.city, 'department:', formData.department, 'shippingDaneCode(state):', formData.shippingDaneCode, 'computedDane:', computedDane);
    }

    // Si no hay código DANE válido, intentar usar la cotización previa (si existe).
    // Algunas veces la cotización tuvo éxito y contiene `destino` (código DANE),
    // pero el nombre de ciudad seleccionado no coincide textualmente con nuestras
    // reglas de normalización. Usar ese destino como último recurso.
    let finalDane = computedDane;
    if (!finalDane || !/^[0-9]{8}$/.test(String(finalDane))) {
      const quoteDestino = shippingRawQuote && (shippingRawQuote.resultado?.Cotizador_cotizarResult?.destino || shippingRawQuote.destino || (shippingRawQuote.resultado && shippingRawQuote.resultado.destino));
      if (quoteDestino) {
        finalDane = String(quoteDestino).trim().replace(/\D/g, '').padEnd(8, '0').slice(0,8);
        console.debug('[CHECKOUT] Usando destino de la cotización como DANE final:', finalDane);
      }
    }
    if (!finalDane || !/^[0-9]{8}$/.test(String(finalDane))) {
      setError('No se pudo determinar el código DANE de la ciudad de destino. Verifica la ciudad y el departamento.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Antes de iniciar el proceso, verificar si el método es Contraentrega
    // y si la ciudad permite COD según el backend. Esto evita crear la orden
    // y mostrar "pedido exitoso" cuando COD no está disponible.
    try {
      if (formData.paymentMethod === 'cash_delivery') {
        const daneToCheck = computedDane;
        try {
          const url = `${API_URL.replace(/\/$/, '')}/coordinadora/validate-cod`;
          console.debug('validate-cod request to', url, 'cityDane=', daneToCheck);
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityDane: daneToCheck, carrier: 'coordinadora' })
          });
          const json = await resp.json();
          console.debug('validate-cod response', json);
          if (!json.allowed) {
            const msg = json.message || 'El pago contraentrega no está disponible para tu ciudad elige otro metodo de pago';
            setError(msg);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        } catch (e) {
          // Si falla la verificación por red, permitir continuar para no romper UX,
          // pero registrar advertencia para depuración y en el servidor se volverá a validar.
          console.warn('validate-cod request failed (network):', e);
        }
      }
    } catch (e) {
      console.warn('COD pre-check error', e);
    }

    setLoading(true)

    try {
      if (import.meta.env.DEV) {
        console.log('DANE enviado:', formData.shippingDaneCode, 'Ciudad:', formData.city, 'Depto:', formData.department);
      }
      const orderData = {
        items: items.map(item => ({ 
          productId: item.id, 
          quantity: item.quantity,
          color: item.color || null,
          colorHex: item.colorHex || null
        })),
        shippingAddress: formData.shippingAddress,
        department: formData.department,
        city: formData.city,
        // Asegura que el código DANE se envía correctamente
        shippingDaneCode: formData.shippingDaneCode || getDaneCode(formData.city, formData.department),
        postalCode: formData.postalCode || '',
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        paymentMethod: formData.paymentMethod,
        shippingCost: shippingCostToSend,
        shippingDeliveryDays: shippingDaysToSend,
        // Incluir la cotización original para que el backend la persista y no vuelva a cotizar
        shippingQuote: shippingRawQuote || null
      }

      // Verify stock against latest product data to avoid race conditions
      for (const it of orderData.items) {
        const pResp = await productService.getById(it.productId)
        const currentStock = Number(pResp.data.stock || 0)
        if (currentStock < it.quantity) throw new Error(`Stock insuficiente para el producto ${pResp.data.title || pResp.data.name || it.productId}`)
      }

      const orderResp = await orderService.create(orderData)
      const order = orderResp.data

      // Para los métodos online usamos la pasarela (Wompi) en el backend.
      const gatewayMethods = ['card', 'nequi', 'pse', 'daviplata', 'bancolombia_transfer', 'corresponsales_bancolombia']
      if (gatewayMethods.includes(formData.paymentMethod)) {
        // En desarrollo/IP remota, backend ignorará el redirectUrl y usará localhost
        // Para sincronización desde IP remota, usamos polling del estado de orden
        const resp = await paymentService.createWompi({ 
          orderId: order.id, 
          paymentMethod: formData.paymentMethod, 
          redirectUrl: window.location.origin, // Backend ignora esto en desarrollo
          // Solicitar explicitamente el checkout público (/p/) para que Wompi
          // reciba el parámetro `payment_method_type` vía query string.
          usePublicCheckout: true
        })
        const checkoutUrl = resp.data?.checkout_url
        
        if (checkoutUrl) {
            // Agrega el parámetro payment_method_type según el método seleccionado
            const methodMap = {
              nequi: 'NEQUI',
              card: 'CARD',
              pse: 'PSE',
              daviplata: 'DAVIPLATA',
              bancolombia_transfer: 'BANCOLOMBIA_TRANSFER',
              corresponsales_bancolombia: 'CORRESPONSALES_BANCOLOMBIA'
            };
            const selectedType = methodMap[formData.paymentMethod];
            let finalUrl = checkoutUrl;
            if (selectedType) {
              try {
                const urlObj = new URL(checkoutUrl);
                urlObj.searchParams.set('payment_method_type', selectedType);
                finalUrl = urlObj.toString();
              } catch (e) {
                // Si checkoutUrl no es una URL válida, usar tal cual
                finalUrl = checkoutUrl;
              }
            }
            clearCart();
            window.location.href = finalUrl;
          
          // Polling: verifica estado de la orden cada 3 segundos
          // Esto permite que incluso si Wompi redirige a localhost desde otro PC,
          // el cliente remoto se sincronice automáticamente
          const pollInterval = setInterval(async () => {
            try {
              // Prefer authenticated fetch; if no token/401, fallback a guest
              let statusResp
              try {
                statusResp = await orderService.getById(order.id)
              } catch {
                const guestEmail = formData.email || ''
                statusResp = await orderService.getGuest(order.id, guestEmail)
              }
              const orderStatus = statusResp.data?.status
              
              // Si el pago fue completado, ir a página de confirmación
              if (orderStatus === 'completed' || orderStatus === 'paid') {
                clearInterval(pollInterval)
                // No cerramos la ventana de Wompi; algunos navegadores la cierran solos tras el redirect
                navigate(`/payment-result?orderId=${order.id}&status=success`)
                return
              }
              
              // Si fue cancelado/fallido
              if (orderStatus === 'cancelled' || orderStatus === 'failed') {
                clearInterval(pollInterval)
                // Mantener la ventana abierta para que el usuario vea el mensaje de Wompi
                navigate(`/payment-result?orderId=${order.id}&status=failed`)
                return
              }
            } catch (pollErr) {
              // Error en polling, continuar intentando
              console.error('Polling error:', pollErr)
            }
          }, 3000)
          
          // Detener polling después de 10 minutos (timeout)
          setTimeout(() => clearInterval(pollInterval), 600000)
          
          return
        }
      }

      // Para contraentrega, mostrar mensaje de éxito profesional y limpiar carrito
      if (formData.paymentMethod === 'cash_delivery') {
        // Mensaje específico para contra entrega, según solicitud
        successMsgRef.current = '¡Pedido exitoso! Tu pedido ha sido recibido y está en proceso. Pronto nos comunicaremos, por favor revisa tu correo para coordinar la entrega y el pago.';
        setSuccessMsg(successMsgRef.current);
        clearCart();
        return;
      }
      // Otros métodos: limpiar y navegar
      clearCart();
      if (!auth.isAuthenticated) {
        navigate(`/create-account?email=${encodeURIComponent(formData.email || '')}&name=${encodeURIComponent(formData.name || '')}`);
      } else {
        navigate('/orders');
      }
      // (Eliminado: declaración incorrecta de useState dentro de función)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al procesar el pedido'
      const reason = err.response?.data?.reason
      const fullError = reason ? `${errorMsg}: ${reason}` : errorMsg
      setError(fullError)
    } finally {
      setLoading(false)
    }
  }

  // ...existing code...
  // Modal de éxito
  if (showSuccessModal) {
    return (
      <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 32px #0002',padding:'2.5em 2em',maxWidth:400,width:'90%',textAlign:'center',animation:'modalIn .3s'}}>
          <div style={{fontSize:'2.2em',color:'#16a34a',marginBottom:'0.5em'}}>
            <span role="img" aria-label="éxito">✅</span>
          </div>
          {/* Botones de acción del resumen */}
          {!showSuccessModal && (
            <div className="checkout-summary-actions">
              <button
                className="btn btn-primary btn-block"
                style={{ marginBottom: 12, width: '100%', maxWidth: 260 }}
                onClick={handleCustomSubmit}
                disabled={loading || !!successMsg}
                type="button"
              >
                Proceder al pago
              </button>
              {formData.paymentMethod !== 'cash_delivery' && (
                <button
                  className="btn btn-secondary btn-block"
                  style={{ width: '100%', maxWidth: 260 }}
                  onClick={clearCart}
                  disabled={loading || !!successMsg}
                  type="button"
                >
                  Vaciar carrito
                </button>
              )}
            </div>
          )}
          <div style={{fontWeight:600,fontSize:'1.25em',marginBottom:'0.5em'}}>
            {successMsg || successMsgRef.current}
          </div>
          <div style={{color:'#166534',fontSize:'1em',marginBottom:'1.5em'}}>¡Tu pedido fue realizado con éxito!</div>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              if (!auth.isAuthenticated) {
                navigate(`/create-account?email=${encodeURIComponent(formData.email || '')}&name=${encodeURIComponent(formData.name || '')}`);
              } else {
                navigate('/');
              }
            }}
            style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75em 2em',fontWeight:600,fontSize:'1em',cursor:'pointer',boxShadow:'0 2px 8px #16a34a22'}}>
            Continuar
          </button>
        </div>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="container">
          <h2>No hay productos en el carrito</h2>
          <p>Vuelve al carrito para agregar productos</p>
        </div>
      </div>
    );
  }

  // Obtener las ciudades del departamento seleccionado (compatibilidad)
  // Buscar la clave canónica del departamento en `departments` (maneja acentos/variantes)
  const departmentCanonical = formData.department
    ? (departments.find(d => normalizeDiacritics(d) === normalizeDiacritics(formData.department)) || formData.department)
    : '';

  const availableCities = departmentCanonical ? (citiesByDepartment[departmentCanonical] || []) : [];

  // Lista completa de ciudades + departamento tomada de `backend/config/shipping_rates.json`.
  // Usaremos esta lista para mostrar las 1.119 ciudades completas en el select cuando el usuario lo desee.
  const cityOptionsFromRates = fixedShippingRates.map((r) => ({
    // Use the city name as the option value so the select can be bound to `formData.city` directly
    value: String(r.ciudad),
    label: String(r.ciudad),
    ciudad: r.ciudad,
    departamento: r.departamento,
    codigo: r.codigo
  }))

  // Orden alfabético A -> Z, ignorando acentos y mayúsculas (sensibilidad base para locales ES)
  const sortedCityOptions = cityOptionsFromRates.slice().sort((a, b) =>
    a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
  )

  // Filtrar las opciones de ciudad según el departamento seleccionado (normalizando acentos/mayúsculas)
  const filteredCityOptions = formData.department
    ? sortedCityOptions.filter(c => {
        const depOpt = normalizeDiacritics(c.departamento || '');
        const depSel = normalizeDiacritics(formData.department || '');
        return depOpt === depSel;
      })
    : [];

  // Si no hay coincidencias en shippingRates, construir opciones a partir de `citiesByDepartment`
  const cityOptionsFromDept = (availableCities || []).slice().sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })).map(c => ({ value: c, label: c, ciudad: c, departamento: departmentCanonical }));

  // Helpers para validación de tarjeta
  // Funciones de tarjeta y helpers de formato (mantener solo si se usan en el render)
  function luhnCheck(num) {
    if (!num || num.length < 12) return false;
    const arr = (num + '').split('').reverse().map(x => parseInt(x, 10));
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      let val = arr[i];
      if (i % 2 === 1) {
        val *= 2;
        if (val > 9) val -= 9;
      }
      sum += val;
    }
    return sum % 10 === 0;
  }
  function detectCardBrand(number) {
    if (!number) return '';
    if (/^4/.test(number)) return 'VISA';
    if (/^(5[1-5])/.test(number) || /^(22[2-9]|2[3-6][0-9]|27[01]|2720)/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'AMEX';
    return '';
  }
  function validateExpiry(value) {
    if (!value) return false;
    const m = value.replace(/\s+/g, '');
    const parts = m.split('/');
    if (parts.length !== 2) return false;
    let mm = parseInt(parts[0], 10);
    let yy = parseInt(parts[1], 10);
    if (isNaN(mm) || isNaN(yy)) return false;
    if (mm < 1 || mm > 12) return false;
    if (yy < 100) yy += 2000;
    const exp = new Date(yy, mm - 1, 1);
    const now = new Date();
    exp.setMonth(exp.getMonth() + 1);
    return exp > now;
  }
  function validateCVV(cvv, brand) {
    if (!cvv) return false;
    const v = cvv.trim();
    if (brand === 'AMEX') return /^[0-9]{4}$/.test(v);
    return /^[0-9]{3}$/.test(v);
  }
  function formatCardNumber(num) {
    if (!num) return '';
    const s = num.replace(/\D/g, '');
    if (cardBrand === 'AMEX') {
      return s.replace(/(\d{1,4})(\d{1,6})?(\d{1,5})?/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
    }
    return s.replace(/(\d{1,4})/g, '$1 ').trim();
  }
  function formatExpiryInput(val) {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return digits.slice(0,2) + '/' + digits.slice(2,4);
  }
  function renderCardIcon(brand) {
    if (!brand) return null;
    if (brand === 'VISA') return (
      <svg className="card-brand-icon" viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#1A1F71"/><text x="6" y="15" fontSize="10" fill="#fff">VISA</text></svg>
    );
    if (brand === 'Mastercard') return (
      <svg className="card-brand-icon" viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#FF5F00"/><text x="3" y="15" fontSize="10" fill="#fff">MC</text></svg>
    );
    if (brand === 'AMEX') return (
      <svg className="card-brand-icon" viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#2E77BC"/><text x="2" y="15" fontSize="9" fill="#fff">AMEX</text></svg>
    );
    return null;
  }
  function formatCurrency(amount) {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n));
  }

  // Validación de campos obligatorios y mensajes de error
  // (Declaración de fieldErrors ya está al inicio del componente)

  function validateFields(data) {
    const errors = {};
    // Validar datos personales: siempre requerimos teléfono; nombre/email sólo para invitados
    if (!auth.isAuthenticated) {
      if (!data.name?.trim()) errors.name = 'El nombre es obligatorio.';
      if (!data.email?.trim()) {
        errors.email = 'El correo es obligatorio.';
      } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        errors.email = 'El correo no es válido.';
      }
    }
    // Teléfono siempre requerido y validado
    if (!data.phone?.trim()) {
      errors.phone = 'El teléfono es obligatorio.';
    } else if (!/^\d{7,15}$/.test(data.phone.replace(/\D/g, ''))) {
      errors.phone = 'El teléfono no es válido.';
    }
    // Siempre validar dirección y pago
    if (!data.shippingAddress?.trim()) errors.shippingAddress = 'La dirección es obligatoria.';
    if (!data.neighborhood?.trim()) errors.neighborhood = 'El barrio es obligatorio.';
    if (!data.department?.trim()) errors.department = 'El departamento es obligatorio.';
    if (!data.city?.trim()) errors.city = 'La ciudad es obligatoria.';
    if (!data.paymentMethod?.trim()) errors.paymentMethod = 'El método de pago es obligatorio.';
    return errors;
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    const errors = validateFields(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(firstKey);
      if (el) el.focus();
      return;
    }
    handleSubmit(e);
  }

  return (
    <>
      <SEO
        title="Finalizar compra"
        description="Completa tus datos de envío y elige tu método de pago para finalizar tu compra en Karell Premium."
        robots="noindex, nofollow"
      />
      <div className="checkout-page">
      <div className="container">
        <div className="page-header checkout-header">
          <button onClick={() => navigate('/cart')} className="btn-back">
            ← Volver al carrito
          </button>
          <h1 className="checkout-title">
            <span className="checkout-title-main"><IconCart style={{marginRight:8,marginBottom:-3}} size={26} color="#2563eb"/> Finalizar compra</span>
            <span className="checkout-title-bar"></span>
          </h1>
        </div>

        {error && <div className="error">{error}</div>}
        {successMsg && (
          <div className="success-message" style={{background:'#e6f9ed',border:'1px solid #16a34a',color:'#166534',padding:'1.2em',borderRadius:'8px',fontSize:'1.15em',marginBottom:'1.5em',textAlign:'center',fontWeight:600}}>
            {successMsg}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-form">
            <h2 className="checkout-section-title">
              <span className="checkout-section-icon"><IconBox style={{marginRight:4,marginBottom:-2}} size={20} color="#2563eb"/></span> Dirección de envío
            </h2>
            {/* Mensaje general de error si hay algún error de campo */}
            {Object.keys(fieldErrors).length > 0 && (
              <div className="field-error" style={{marginBottom:'1em',fontSize:'1.08em',fontWeight:600}}>
                Por favor completa todos los campos obligatorios marcados en rojo.
              </div>
            )}
            <form onSubmit={handleCustomSubmit} noValidate style={successMsg ? { pointerEvents: 'none', opacity: 0.6 } : {}}>
              <div className="form-row">
                <InputField
                  label="Dirección"
                  id="shippingAddress"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  error={fieldErrors.shippingAddress}
                  required
                  disabled={loading}
                  type="text"
                />
                <InputField
                  label="Barrio"
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  error={fieldErrors.neighborhood}
                  placeholder="Nombre del barrio"
                  disabled={loading}
                  type="text"
                />
              </div>

              <div className="form-row">
                <SelectField
                  label="Departamento"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  error={fieldErrors.department}
                  required
                  disabled={loading}
                  options={[
                    { value: '', label: 'Seleccione un departamento...' },
                    ...departments.map(dept => ({ value: dept, label: dept }))
                  ]}
                />
                <SelectField
                  label="Ciudad"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) {
                      handleChange(e)
                      return
                    }
                    // Buscar la entrada por nombre de ciudad (normalizando)
                    const findNormalize = s => (s || '').trim().toLowerCase();
                    const normV = findNormalize(v)
                    const entry = fixedShippingRates.find(r => findNormalize(r.ciudad) === normV)
                    if (entry) {
                      // Resolver departamento canónico pero NO sobrescribir el departamento
                      // si el usuario ya lo seleccionó — eso puede hacer que la ciudad
                      // desaparezca de las opciones.
                      const depCanonical = departments.find(d => findNormalize(d) === findNormalize(entry.departamento));
                      const depToSet = depCanonical || entry.departamento;
                      // Buscar la forma canónica de la ciudad dentro de las ciudades
                      // del departamento (si existe) para asegurar que el valor
                      // que ponemos en el select exista entre las opciones.
                      const available = departmentCanonical ? (citiesByDepartment[departmentCanonical] || []) : [];
                      const cityCanonicalInDept = available.find(c => findNormalize(c) === findNormalize(entry.ciudad));
                      const cityToSet = cityCanonicalInDept || entry.ciudad;
                      console.debug('Checkout: selected city ->', entry.ciudad, 'resolved city canonical ->', cityToSet, 'resolved department ->', depToSet)
                      setFormData(prev => {
                        const newDept = prev.department && prev.department.trim() ? prev.department : depToSet;
                        return {
                          ...prev,
                          city: cityToSet,
                          department: newDept,
                          shippingDaneCode: getDaneCode(cityToSet, newDept)
                        };
                      })
                    } else {
                      handleChange(e)
                    }
                  }}
                  error={fieldErrors.city}
                  required
                  disabled={loading || !formData.department}
                  options={
                    !formData.department
                      ? [{ value: '', label: 'Primero seleccione un departamento' }]
                      : (
                          (cityOptionsFromDept && cityOptionsFromDept.length > 0)
                            ? [ { value: '', label: 'Seleccione una ciudad...' }, ...cityOptionsFromDept ]
                            : (filteredCityOptions.length > 0
                                ? [ { value: '', label: 'Seleccione una ciudad...' }, ...filteredCityOptions ]
                                : [ { value: '', label: 'Seleccione una ciudad...' }, ...cityOptionsFromRates.filter(c => c.ciudad && c.ciudad.toLowerCase().startsWith((formData.city||'').trim().toLowerCase())) ]
                              )
                        )
                  }
                />
              </div>

              <>
                <h3>Datos del cliente</h3>
                <div className={auth.isAuthenticated ? 'form-row' : 'form-row form-row-3'}>
                  {!auth.isAuthenticated && (
                    <>
                      <InputField
                        label="Nombre"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={fieldErrors.name}
                        required
                        disabled={loading}
                        type="text"
                      />
                      <InputField
                        label="Email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={fieldErrors.email}
                        required
                        disabled={loading}
                        type="email"
                      />
                    </>
                  )}
                  {/* Mostrar siempre el input Teléfono; si el usuario está logueado se prefillará con auth.user?.phone */}
                  <InputField
                    label="Teléfono"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={fieldErrors.phone}
                    disabled={loading}
                    type="text"
                  />
                </div>
                {/* Versión inline del resumen para móviles: se muestra solo en CSS móvil */}
                <div className="checkout-summary-inline" aria-hidden="false">
                  <h2>Resumen del pedido</h2>
                  <div className="order-items">
                    {items.map(item => (
                      <div key={item.key || item._id} className="order-item">
                        <span>
                          {item.title || item.name} x {item.quantity}
                          {item.color && (
                            <span className="item-color-badge" style={{ marginLeft: '8px', fontSize: '13px' }}>
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
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="summary-divider"></div>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span className="summary-value">${formatCurrency(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    {!formData.city
                      ? <span>Seleccione una ciudad</span>
                      : shippingLoading
                        ? <span>Cotizando...</span>
                        : hasValidShippingQuote
                          ? (
                              <>
                                <span>Envío a {formData.city}:</span>
                                <span className="summary-value">${cityContainsCali(quotedCity) ? '8.000' : formatCurrency(shippingCost)}</span>
                              </>
                            )
                          : <span>No disponible</span>
                    }
                  </div>
                  <div className="summary-row">
                    {formData.city && hasValidShippingQuote && (
                      <>
                        <span>Entrega estimada:</span>
                        <span className="summary-value">{cityContainsCali(quotedCity) ? '1 día' : (shippingDeliveryDays ? `${shippingDeliveryDays} día${Number(shippingDeliveryDays) === 1 ? '' : 's'}` : '')}</span>
                      </>
                    )}
                  </div>
                  {shippingError && <div className="shipping-quote-note error">{shippingError}</div>}
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>${formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </>

              <h2 className="checkout-section-title mt-4">
                <span className="checkout-section-icon"><IconCard style={{marginRight:4,marginBottom:-2}} size={20} color="#2563eb"/></span> Información de pago
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">Método de pago</label>
                  <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} disabled={loading} className={fieldErrors.paymentMethod ? 'invalid' : ''}>
                    {fieldErrors.paymentMethod && <div className="field-error">{fieldErrors.paymentMethod}</div>}
                    <option value="">Selecciona método de pago</option>
                    <option value="card">Tarjeta</option>
                    <option value="bancolombia_transfer">Transferencia Bancolombia</option>
                    <option value="nequi">Nequi</option>
                    <option value="pse">PSE (Pago en línea)</option>
                    <option value="cash_delivery">Contra entrega</option>
                    <option value="corresponsales_bancolombia">Corresponsales Bancolombia</option>
                    <option value="daviplata">DAVIPLATA</option>
                  </select>
                </div>
                {(formData.paymentMethod === 'nequi' || formData.paymentMethod === 'daviplata') ? (
                  <div className="form-group">
                    <label>{formData.paymentMethod === 'nequi' ? 'Teléfono asociado a Nequi' : 'Teléfono DAVIPLATA'}</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} disabled={loading} />
                    <small>
                      {formData.paymentMethod === 'nequi'
                        ? 'Se generará la instrucción de pago y serás redirigido para completar.'
                        : 'Se enviará la solicitud de pago a DAVIPLATA.'}
                    </small>
                  </div>
                ) : <div></div>}
              </div>

              {formData.paymentMethod === 'card' && (
                <>
                  <div className="form-group">
                    <small>Seleccionaste pago con tarjeta. Los datos se usan solo para pre-validación local; el pago se procesará de forma segura en la pasarela.</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cardNumber">Número de tarjeta</label>
                      <div className="card-hint" style={{width:'100%'}}>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={formatCardNumber(formData.cardNumber)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\s+/g, '')
                            handleChange({ target: { name: 'cardNumber', value: raw } })
                            const brand = detectCardBrand(raw)
                            setCardBrand(brand)
                            setCardValid(luhnCheck(raw))
                          }}
                          placeholder="1234 5678 9012 3456"
                          disabled={loading}
                          className={cardValid === null ? '' : (cardValid ? 'valid' : 'invalid')}
                          style={{flex:2,minWidth:0}}
                        />
                        {renderCardIcon(cardBrand)}
                        <span className="card-brand">{cardBrand ? cardBrand : ''}</span>
                        <select name="cardType" value={formData.cardType || ''} onChange={handleChange} disabled={loading}>
                          <option value="">Seleccione: Débito o Crédito</option>
                          <option value="debit">Débito</option>
                          <option value="credit">Crédito</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cardExpiry">Fecha vencimiento (MM/AA)</label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formatExpiryInput(formData.cardExpiry)}
                        onChange={(e) => {
                          const formatted = formatExpiryInput(e.target.value)
                          handleChange({ target: { name: 'cardExpiry', value: formatted } })
                          setExpiryValid(validateExpiry(formatted))
                        }}
                        placeholder="MM/AA"
                        disabled={loading}
                        className={expiryValid === null ? '' : (expiryValid ? 'valid' : 'invalid')}
                      />
                      <label htmlFor="cardCVC">CVV</label>
                      <input
                        type="text"
                        id="cardCVC"
                        name="cardCVC"
                        value={formData.cardCVC}
                        onChange={(e) => {
                          handleChange(e)
                          setCvvValid(validateCVV(e.target.value, cardBrand))
                        }}
                        placeholder="123"
                        disabled={loading}
                        className={cvvValid === null ? '' : (cvvValid ? 'valid' : 'invalid')}
                      />
                    </div>
                  </div>

                  <div className="payment-icons">
                    <svg className={`pay-icon ${cardBrand === 'VISA' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#1A1F71"/><text x="6" y="15" fontSize="10" fill="#fff">VISA</text></svg>
                    <svg className={`pay-icon ${cardBrand === 'Mastercard' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#FF5F00"/><text x="3" y="15" fontSize="10" fill="#fff">MC</text></svg>
                    <svg className={`pay-icon ${cardBrand === 'AMEX' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#2E77BC"/><text x="2" y="15" fontSize="9" fill="#fff">AMEX</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'nequi'}))} className={`pay-icon ${formData.paymentMethod === 'nequi' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#07BEB8"/><text x="2" y="15" fontSize="7" fill="#fff">NEQUI</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'daviplata'}))} className={`pay-icon ${formData.paymentMethod === 'daviplata' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#00B5E2"/><text x="2" y="15" fontSize="6" fill="#fff">DAVIPLATA</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'bancolombia_transfer'}))} className={`pay-icon ${formData.paymentMethod === 'bancolombia_transfer' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#06266F"/><text x="1" y="15" fontSize="7" fill="#fff">Bancolombia</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'pse'}))} className={`pay-icon ${formData.paymentMethod === 'pse' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#F29F05"/><text x="3" y="15" fontSize="7" fill="#fff">PSE</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'cash_delivery'}))} className={`pay-icon ${formData.paymentMethod === 'cash_delivery' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#16A34A"/><text x="2" y="15" fontSize="7" fill="#fff">Contra entrega</text></svg>
                    <svg onClick={() => setFormData(prev => ({...prev, paymentMethod: 'corresponsales_bancolombia'}))} className={`pay-icon ${formData.paymentMethod === 'corresponsales_bancolombia' ? 'active' : ''}`} viewBox="0 0 24 24" width="36" height="24" aria-hidden><rect width="24" height="14" y="5" rx="2" fill="#666"/><text x="1" y="15" fontSize="6" fill="#fff">Corresponsales</text></svg>
                  </div>
                </>
              )}

              {/* Campos para otros métodos */}
              {/* Eliminado: ahora el input de teléfono aparece junto al método de pago */}

              {formData.paymentMethod === 'bancolombia_transfer' && (
                <div className="form-group">
                  <p>Seleccionaste Transferencia Bancolombia. Te mostraremos los datos de la cuenta y referencia tras confirmar el pedido.</p>
                </div>
              )}

              {formData.paymentMethod === 'pse' && (
                <div className="form-group">
                  <p>Serás redirigido a PSE para completar el pago desde tu banco.</p>
                </div>
              )}


              {formData.paymentMethod === 'cash_delivery' && (
                <div className="form-group">
                  <p>Has seleccionado pago contra entrega. Puedes pagar en efectivo o por transferencia al recibir tu pedido.</p>
                  {codAllowed === false && (
                    <div className="field-error" style={{marginTop:8}}>
                      {codMessage || 'El pago contraentrega no está disponible para tu ciudad con este transportador.'}
                    </div>
                  )}
                  {codAllowed === null && codMessage && (
                    <div className="field-note" style={{marginTop:8}}>{codMessage}</div>
                  )}
                </div>
              )}

              {formData.paymentMethod === 'corresponsales_bancolombia' && (
                <div className="form-group">
                  <p>Has seleccionado pago en Corresponsales Bancolombia. Te enviaremos la referencia para pagar en el corresponsal.</p>
                </div>
              )}
              

              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block mt-4"
                disabled={loading || !!successMsg || (formData.paymentMethod === 'cash_delivery' && codAllowed === false)}
              >
                {loading ? 'Procesando...' : 'Confirmar pedido'}
              </button>
            </form>
          </div>

          <div className="checkout-summary">
            <h2>Resumen del pedido</h2>
            <div className="order-items">
              {items.map(item => (
                <div key={item.key || item._id} className="order-item">
                  <span>
                    {item.title || item.name} x {item.quantity}
                    {item.color && (
                      <span className="item-color-badge" style={{ marginLeft: '8px', fontSize: '13px' }}>
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
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span className="summary-value">${formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              {!formData.city
                ? <span>Seleccione una ciudad</span>
                : shippingLoading
                  ? <span>Cotizando...</span>
                  : hasValidShippingQuote
                    ? (
                        <>
                          <span>Envío a {formData.city}:</span>
                              <span className="summary-value">${cityContainsCali(quotedCity) ? '8.000' : formatCurrency(shippingCost)}</span>
                        </>
                      )
                    : <span>No disponible</span>
              }
            </div>
            <div className="summary-row">
              {formData.city && hasValidShippingQuote && (
                <>
                  <span>Entrega estimada:</span>
                  <span className="summary-value">{cityContainsCali(quotedCity) ? '1 día' : (shippingDeliveryDays ? `${shippingDeliveryDays} día${Number(shippingDeliveryDays) === 1 ? '' : 's'}` : '')}</span>
                </>
              )}
            </div>
            {shippingError && <div className="shipping-quote-note error">{shippingError}</div>}
            <div className="summary-row total">
              <span>Total:</span>
              <span>${formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Checkout
