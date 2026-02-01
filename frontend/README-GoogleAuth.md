# Integración de Google Sign-In en KarellPremium-frontend

## 1. Crear credenciales en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Crea un proyecto o selecciona uno existente.
3. Ve a "APIs y servicios" > "Credenciales".
4. Haz clic en "Crear credencial" > "ID de cliente de OAuth".
5. Selecciona "Aplicación web" y agrega las URLs de tu frontend (ejemplo: http://localhost:5173 y tu dominio en producción).
6. Copia el `Client ID` generado.

## 2. Instalar librería recomendada

En la terminal ejecuta:

```
npm install @react-oauth/google
```

## 3. Configuración básica en React

- Agrega el proveedor de Google en tu archivo principal (ejemplo: `main.jsx`):

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId="TU_CLIENT_ID_AQUI">
  <App />
</GoogleOAuthProvider>
```
```

- Agrega el botón de Google en los formularios de login y registro:

```jsx
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={credentialResponse => {
    // Enviar el token al backend para validar/crear usuario
  }}
  onError={() => {
    // Mostrar error
  }}
/>
```

## 4. Backend

- El backend debe aceptar el token de Google, verificarlo y crear/iniciar sesión del usuario.
- Puedes usar la librería oficial de Google para validar el token en Node.js: `google-auth-library`.

## 5. Seguridad y pruebas

- Prueba en local y producción.
- Verifica que no se rompa el login tradicional.
- El usuario puede elegir entre Google o correo/contraseña.

---

¿Quieres que agregue el código de ejemplo en tus formularios ahora? Si tienes el Client ID de Google, puedo integrarlo directamente.