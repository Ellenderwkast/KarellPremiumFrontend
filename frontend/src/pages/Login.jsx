import React, { useState } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { validateEmail, getEmailError } from '../utils/validation';
import SEO from '../components/SEO';
import '../styles/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      // Lógica real: enviar el token de Google al backend
      const response = await authService.loginWithGoogle(credentialResponse.credential);
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleError = () => setError('No se pudo iniciar sesión con Google');

  return (
    <div className="auth-container">
      <SEO
        title="Iniciar Sesi\u00f3n"
        description="Accede a tu cuenta en Karell Premium para ver tus pedidos, seguimiento de env\u00edos y acceder a ofertas exclusivas."
      />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <p className="auth-subtitle">Accede para seguir tu historial de pedidos y estado de compra.</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="Continuar con Google" />
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
              disabled={loading}
            />
            {emailTouched && email && !validateEmail(email) && (
              <small className="error">El correo ingresado no es válido. Verifica el formato: usuario@correo.com.</small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-link">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
