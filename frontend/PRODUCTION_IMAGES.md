# Imágenes en producción – Tienda E‑Commerce KarellPremium

## Frontend

### 1. Base de API y estáticos

- En producción bajo `karellpremium.com.co`, la opción más estable es servir el frontend con `VITE_API_URL=/api` y resolver `/api` mediante proxy o rewrites hacia el backend publicado.
- Si prefieres usar una URL absoluta, `VITE_API_URL` debe apuntar a la raíz pública actual del backend en Railway o a tu dominio de API, por ejemplo:
  - `VITE_API_URL = https://api.karellpremium.com.co/api`
- El helper `getApiUrl()` (en `frontend/src/services/api.js`) construye `API_URL` a partir de:
  - `VITE_API_URL` cuando está definida.
  - Detección dinámica en localhost / IP LAN / producción cuando no lo está.
- La instancia Axios principal (`api`) usa `API_URL` como `baseURL`.

### 2. Resolución de rutas de imagen

El helper `getStaticUrl(path)` es el ÚNICO punto de entrada para convertir rutas de imagen en URLs finales.

Comportamiento resumido:

- **URLs absolutas (`http://` o `https://`)**:
  - Si el `pathname` comienza por `/uploads` o `/images` y existe `VITE_API_URL`, se normaliza usando la base de `VITE_API_URL` (útil cuando la BD guarda IPs LAN, localhost, etc.).
  - Para el resto de URLs absolutas, se devuelve la URL tal cual.
- **Data URI (`data:`)**:
  - Se devuelven sin cambios (previews locales en formularios/admin).
- **Rutas que empiezan por `/images/`**:
  - Con `VITE_API_URL` definida:
    - Si el origen de `VITE_API_URL` coincide con `window.location.origin`, se usa ese origen.
    - Si el origen de `VITE_API_URL` es distinto, se sirven SIEMPRE desde `window.location.origin` (frontend, build de Vite / Vercel).
  - Sin `VITE_API_URL` (modo dev/LAN):
    - En `localhost` o `127.0.0.1`, se sirven desde el origen del frontend (Vite).
    - Para otras IPs de LAN se mantienen las URLs antiguas apuntando a `http(s)://<host>:4000/images/...`.
- **Rutas que empiezan por `/uploads/` (y resto de rutas absolutas distintas de `/images/`)**:
  - Se construyen SIEMPRE a partir de la base del backend: `API_URL.replace('/api', '') + path`.
  - Ejemplo en producción:
    - `getStaticUrl('/uploads/foo.jpg')` → `https://api.karellpremium.com.co/uploads/foo.jpg`.
- **Rutas relativas** (no empiezan por `http`, `data:` ni `/`):
  - Si comienzan por `uploads/` o `images/`, primero se normalizan a `/uploads/...` o `/images/...` y luego se aplica la lógica anterior.
  - Para cualquier otro prefijo (por ejemplo `avatars/`, `profile-images/`, etc.), se asume que viven en el backend y se construye:
    - `API_URL.replace('/api', '') + '/' + pathNormalizado`.
  - Ejemplo:
    - `getStaticUrl('avatars/u123.png')` → `https://api.karellpremium.com.co/avatars/u123.png`.

### 3. Componentes que usan `getStaticUrl`

- Productos (catálogo, detalle, variantes, carrito):
  - `ProductCard`, `ProductList`, `VariantCarousel`, `cartStore`, `AdminPanel`.
- Blog (portadas y contenido):
  - `BlogList`, `BlogPost`, `ContentsList`, `ContentForm`, `ProductSelector` (productos relacionados).
- Avatares de usuario y reseñas:
  - `Profile`, `ProductDetail` (reviews), entre otros.

En TODOS estos sitios se debe pasar SIEMPRE la ruta cruda proveniente del backend (por ejemplo, `/uploads/...` o `/images/...`) al helper `getStaticUrl` antes de pintar la imagen.

### 4. Variables de entorno en Vercel (frontend)

En el proyecto de Vercel del frontend, configurar al menos:

- `VITE_API_URL = /api` si vas a usar el mismo dominio del frontend como entrada pública.
- O `VITE_API_URL = https://api.karellpremium.com.co/api` si vas a consumir la API de forma directa.

Efectos:

- `getApiUrl()` devolverá la URL efectiva configurada para producción.
- Todas las peticiones Axios realizadas mediante `api` irán contra esa URL efectiva.
- `getStaticUrl('/uploads/...')` generará la ruta equivalente sobre el backend configurado.
- `getStaticUrl('/images/...')` generará `https://www.karellpremium.com.co/images/...` cuando el frontend esté desplegado en Vercel bajo ese dominio.

Importante:

- Si el proyecto de Vercel todavía tiene una variable `VITE_API_URL` apuntando a Render, esa variable sobrescribirá el valor del repositorio durante el build.
- Después de migrar a Railway, elimina o actualiza cualquier valor antiguo de `VITE_API_URL` en Vercel y vuelve a desplegar.
- En Railway, asegúrate de configurar `CORS_ORIGINS=https://karellpremium.com.co,https://www.karellpremium.com.co` y `FRONTEND_URL=https://www.karellpremium.com.co`.

### 5. Pruebas manuales en producción

1. **Home / catálogo**
   - Visitar `https://www.karellpremium.com.co/`.
   - Verificar que las tarjetas de producto (`ProductCard`) muestran imágenes.
   - Inspeccionar el DOM y comprobar que las `img[src]` de productos apuntan a:
     - `/images/...` → dominio del frontend (Vercel).
  - `/uploads/...` → dominio del backend configurado (por ejemplo `https://api.karellpremium.com.co`).
2. **Detalle de producto**
   - Abrir una URL de producto: `https://www.karellpremium.com.co/products/<id>`.
   - Comprobar galerías, variantes de color y reseñas (avatares).
3. **Blog**
   - Visitar `https://www.karellpremium.com.co/blog`.
   - Verificar que las portadas de los posts cargan correctamente.
   - Abrir un post (`/blog/<slug>`) y comprobar:
     - Portada principal.
     - Imágenes dentro del contenido (`<img src="/uploads/...">`) usando `Inspect` → atributo `src` debe apuntar al backend.
4. **Panel Admin (si accesible en producción)**
   - Revisar previsualizaciones de imágenes en:
     - Lista/edición de productos.
     - Lista/edición de contenidos del blog.

Si alguna imagen no se ve:

- Revisar en consola (modo dev) los logs de `getStaticUrl(...)`.
- Confirmar que la ruta en BD tiene el prefijo correcto (`/uploads/...` o `/images/...`).
- Verificar que `VITE_API_URL` en Vercel coincide exactamente con la URL pública de la API (`.../api`).
