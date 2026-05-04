# Frontend - Tienda E-Commerce

Frontend moderno construido con React 18 y Vite, con interfaz responsiva y experiencia de usuario mejorada.

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
npm install
```

## Variables de Entorno

Copia `.env.example` a `.env` y configura las variables:

```env
VITE_API_URL=http://localhost:4000/api
```

En producción, evita dejar `VITE_API_URL` apuntando a proveedores antiguos. Si migraste el backend, actualiza también la variable del proyecto desplegado y vuelve a generar el build.

## Scripts Disponibles

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo en http://localhost:3000

### Construcción

```bash
npm run build
```

Crea una compilación optimizada para producción

### Preview

```bash
npm run preview
```

Previsuaciona la compilación de producción localmente

### Linting

```bash
npm run lint
```

Verifica errores de código

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── ProtectedRoute.jsx
│   ├── ProductCard.jsx
│   └── ProductList.jsx
│
├── pages/              # Páginas principales
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Orders.jsx
│   ├── Login.jsx
│   └── Register.jsx
│
├── store/              # Gestión de estado (Zustand)
│   ├── authStore.js    # Estado de autenticación
│   └── cartStore.js    # Estado del carrito
│
├── services/           # Servicios de API
│   └── api.js          # Cliente HTTP con Axios
│
├── styles/             # Archivos CSS
│   ├── index.css       # Estilos globales
│   ├── layout.css
│   ├── header.css
│   ├── footer.css
│   ├── productList.css
│   ├── productCard.css
│   ├── auth.css
│   ├── home.css
│   ├── products.css
│   ├── productDetail.css
│   ├── cart.css
│   ├── checkout.css
│   └── orders.css
│
├── App.jsx             # Configuración de rutas
├── main.jsx            # Punto de entrada
└── index.html          # HTML principal
```

## Componentes Principales

### Header

- Navegación principal
- Carrito de compras con contador
- Menú de usuario autenticado

### ProductList

- Grid responsivo de productos
- Carga dinámica desde la API

### ProductCard

- Imagen del producto
- Precio y descripción
- Botones de vista detallada y carrito

### Cart

- Listado de productos agregados
- Modificación de cantidades
- Resumen de totales
- Botón de proceder al checkout

### Checkout

- Formulario de dirección de envío
- Datos de pago
- Resumen final del pedido

## Gestión de Estado

### authStore (Zustand)

```javascript
{
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => void,
  logout: () => void,
  setUser: (user) => void
}
```

### cartStore (Zustand)

```javascript
{
  items: [],
  addItem: (product) => void,
  removeItem: (productId) => void,
  updateQuantity: (productId, quantity) => void,
  clearCart: () => void,
  getTotal: () => number
}
```

Ambos stores están persistidos en localStorage.

## Servicios API

Usa Axios con interceptores de autenticación:

```javascript
// Autenticación
authService.login(email, password);
authService.register(userData);

// Productos
productService.getAll();
productService.getById(id);
productService.search(query);

// Pedidos
orderService.create(orderData);
orderService.getAll();
orderService.getById(id);
orderService.updateStatus(id, status);
```

## Estilos

El proyecto utiliza CSS puro con variables CSS para mantener consistencia:

- Colores predefinidos
- Tipografía escalable
- Breakpoints responsivos
- Componentes reutilizables

## Build con Docker

```bash
# Construcción
docker build -t tienda-frontend .

# Ejecución
docker run -p 3000:3000 tienda-frontend
```

## Características

✅ Autenticación y autorización
✅ Catálogo de productos dinámico
✅ Carrito de compras persistente
✅ Proceso de checkout
✅ Historial de pedidos
✅ Interfaz responsiva
✅ Gestión de estado con Zustand
✅ Validación de formularios
✅ Manejo de errores

## Navegación

- `/` - Página de inicio
- `/products` - Catálogo completo
- `/products/:id` - Detalle de producto
- `/cart` - Carrito de compras
- `/checkout` - Procesar pedido
- `/orders` - Historial de pedidos
- `/login` - Iniciar sesión
- `/register` - Crear cuenta

## Rendimiento

- Optimización de imágenes
- Lazy loading de rutas
- Minimización de dependencias
- Build optimizado con Vite

---

**Versión**: 1.0.0  
**Última actualización**: 24 de noviembre de 2025
