import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const isDev = import.meta.env.DEV;

// Detecta la URL del API dinámicamente en tiempo de ejecución
const getApiUrl = () => {
  if (isDev) {
    console.log('window.location:', {
    href: window.location.href,
    hostname: window.location.hostname,
    port: window.location.port,
    origin: window.location.origin
    });
  }

  // 1) Si hay variable de entorno explícita, usarla
  if (import.meta.env.VITE_API_URL) {
    if (isDev) {
      console.log('ℹ️ API URL desde .env:', import.meta.env.VITE_API_URL);
    }
    return import.meta.env.VITE_API_URL;
  }

  // 2) Detección dinámica
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // Si estamos en localhost o 127.0.0.1, siempre usar puerto 4000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = `${protocol}//localhost:4000/api`;
    if (isDev) console.log('ℹ️ API URL (localhost):', url);
    return url;
  }
  
  // Si está en el mismo origen (ngrok/producción), usar /api
  if (port === '' || port === '80' || port === '443') {
    const url = `${window.location.origin}/api`;
    if (isDev) console.log('ℹ️ API URL (producción/ngrok):', url);
    return url;
  }
  
  // Otras direcciones IP en desarrollo: usar puerto 4000
  const url = `${protocol}//${hostname}:4000/api`;
  if (isDev) {
    console.log('ℹ️ API URL (desarrollo con IP):', url);
    console.log('  - Protocol:', protocol);
    console.log('  - Hostname:', hostname);
  }
  return url;
};

export const API_URL = getApiUrl();
if (isDev) console.log('API_URL configurada:', API_URL);

// Helper para obtener URL completa de archivos estáticos
export const getStaticUrl = path => {
  if (!path) return '';

  // 1) URLs absolutas (http/https):
  //    - Si apuntan a /uploads o /images en una IP/LAN antigua, normalizamos
  //      a la base de VITE_API_URL cuando esté definida.
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      const pathname = parsed.pathname || '';
      if (pathname.startsWith('/uploads') || pathname.startsWith('/images')) {
        if (import.meta.env.VITE_API_URL) {
          const base = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
          const fullUrl = `${base}${pathname}`;
          if (isDev) console.log(`getStaticUrl(absolute-normalized) '${path}' => '${fullUrl}'`);
          return fullUrl;
        }
        // si no hay VITE_API_URL, devolver la ruta tal cual
        return path;
      }
    } catch (e) {
      return path;
    }
    return path; // otras URLs externas se respetan tal cual
  }

  // 2) Data URI (previews locales)
  if (path.startsWith('data:')) return path;

  // 3) Rutas absolutas manejadas por nuestros servidores
  if (path.startsWith('/')) {
    const origin = window.location.origin;

    // 3.a) /images/... → normalmente estáticos del frontend (Vite / Vercel)
    //     pero conservando compatibilidad con escenarios LAN antiguos.
    if (path.startsWith('/images/')) {
      try {
        const envApiUrl = import.meta.env.VITE_API_URL;

        if (envApiUrl) {
          // Si tenemos VITE_API_URL, decidimos según el host:
          // - Si API y frontend comparten origen → usar ese origen.
          // - Si son distintos (ej: Vercel + Render) → servir desde el origen del frontend.
          try {
            const apiUrl = new URL(envApiUrl);
            const apiOrigin = apiUrl.origin;
            if (apiOrigin === origin) {
              const fullUrl = `${apiOrigin}${path}`;
              if (isDev) console.log(`getStaticUrl(images same-origin) '${path}' => '${fullUrl}'`);
              return fullUrl;
            }
            const fullUrl = `${origin}${path}`;
            if (isDev) console.log(`getStaticUrl(images frontend-origin) '${path}' => '${fullUrl}'`);
            return fullUrl;
          } catch {
            const fullUrl = `${origin}${path}`;
            if (isDev) console.log(`getStaticUrl(images origin-fallback) '${path}' => '${fullUrl}'`);
            return fullUrl;
          }
        }

        // Sin VITE_API_URL: mantener el comportamiento previo
        const hostname = window.location.hostname;
        // Cuando el navegador está en 'localhost' preferimos servir desde Vite
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          const fullUrl = `${origin}${path}`;
          if (isDev) console.log(`getStaticUrl(images dev-localhost) '${path}' => '${fullUrl}'`);
          return fullUrl;
        }

        // Para dispositivos en la LAN que visitan la web a través de la IP del host,
        // asumir que el backend escucha en el puerto 4000 en la misma IP del host.
        const proto = window.location.protocol;
        const fullUrl = `${proto}//${hostname}:4000${path}`;
        if (isDev) console.log(`getStaticUrl(images lan-4000) '${path}' => '${fullUrl}'`);
        return fullUrl;
      } catch (e) {
        const hostname = window.location.hostname;
        const port = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
        const baseUrl = `${window.location.protocol}//${hostname}${port && port !== '80' && port !== '443' ? ':' + port : ''}`;
        const fullUrl = `${baseUrl}${path}`;
        if (isDev) console.log(`getStaticUrl(images-fallback) '${path}' => '${fullUrl}'`);
        return fullUrl;
      }
    }

    // 3.b) /uploads/... y otras rutas absolutas → siempre desde el backend
    const baseUrl = API_URL.replace('/api', ''); // Quitar /api del final
    const fullUrl = `${baseUrl}${path}`;
    if (isDev) console.log(`getStaticUrl('${path}') => '${fullUrl}'`);
    return fullUrl;
  }

  // 4) Rutas relativas conocidas: normalizar prefijos "uploads/" o "images/" a rutas absolutas
  //    para que se beneficien de la lógica anterior.
  const cleaned = path.replace(/^\.\//, '');
  if (cleaned.startsWith('uploads/')) {
    const normalized = `/${cleaned}`;
    if (isDev) console.log(`getStaticUrl(relative-uploads) '${path}' => '${normalized}'`);
    return getStaticUrl(normalized);
  }
  if (cleaned.startsWith('images/')) {
    const normalized = `/${cleaned}`;
    if (isDev) console.log(`getStaticUrl(relative-images) '${path}' => '${normalized}'`);
    return getStaticUrl(normalized);
  }

  // 5) Otras rutas relativas: asumir que apuntan al backend (por ejemplo
  //    "avatars/..", "profile-images/..."), construyendo la URL con la
  //    base de API_URL sin el sufijo "/api".
  const baseUrl = API_URL.replace('/api', '');
  const normalizedRelative = cleaned.replace(/^\/+/, '');
  const fullUrl = `${baseUrl}/${normalizedRelative}`;
  if (isDev) console.log(`getStaticUrl(relative-backend) '${path}' => '${fullUrl}'`);
  return fullUrl;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: userData => api.post('/auth/register', userData),
  logout: () => useAuthStore.getState().logout(),
  getProfile: () => api.get('/auth/me'),
  updateProfile: data => api.patch('/auth/me', data),
  createFromOrder: data => api.post('/auth/create-from-order', data),
  getAllUsers: () => api.get('/auth/users'),
  createUser: data => api.post('/auth/users', data),
  updateUserRole: (id, isAdmin) => api.patch(`/auth/users/${id}/role`, { isAdmin }),
  deleteUser: id => api.delete(`/auth/users/${id}`)
};

export const productService = {
  getAll: () => api.get('/products'),
  getAllAdmin: () => api.get('/products/admin'),
  getById: id => api.get(`/products/${id}`),
  getByIdAdmin: id => api.get(`/products/admin/${id}`),
  search: query => api.get('/products/search', { params: { q: query } }),
  searchAdmin: query => api.get('/products/admin/search', { params: { q: query } }),
  create: data => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: id => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data)
  ,
  uploadImage: (formData, config = {}) => api.post('/products/upload-image', formData, config)
};

export const orderService = {
  create: orderData => api.post('/orders', orderData),
  createManual: orderData => api.post('/orders/manual', orderData),
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders/all'),
  getById: id => api.get(`/orders/${id}`),
  getGuest: (id, email) => api.get(`/orders/guest/${id}`, { params: { email } }),
  updateStatus: (id, status) => api.patch(`/orders/${id}`, { status }),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`)
};

export const paymentService = {
  createWompi: data => api.post('/payments/wompi/create', data),
  signWompi: data => api.post('/payments/wompi/sign', data)
};

export const shippingService = {
  calculate: (city, items, department) => api.post('/shipping/calculate', { city, department, items }),
  cotizarCoordinadora: (data) => api.post('/coordinadora/cotizar', data)
};

export const productInterestService = {
  create: (data) => api.post('/product-interest', data),
  list: (params) => api.get('/product-interest', { params }),
  update: (id, data) => api.patch(`/product-interest/${id}`, data),
  delete: (id) => api.delete(`/product-interest/${id}`)
};

export const reviewService = {
  listByProduct: (productId) => api.get(`/products/${productId}/reviews`),
  createForProduct: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`)
};

export default api;
