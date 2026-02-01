import { useState } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { validateEmail, getEmailError } from '../utils/validation';
import SEO from '../components/SEO';
import '../styles/auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailError = getEmailError(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      // Aquí deberías enviar credentialResponse.credential a tu backend para validar y autenticar
      // Ejemplo:
      // const response = await authService.loginWithGoogle(credentialResponse.credential);
      // login(response.data.user, response.data.token);
      // navigate('/');
      alert('Google registro/login exitoso (simulado). Implementa la lógica de backend.');
    } catch (err) {
      setError('No se pudo registrar con Google');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleError = () => setError('No se pudo registrar con Google');

  return (
    <div className="auth-container">
      <SEO
        title="Registrarse"
        description="Crea tu cuenta en Karell Premium para acceder a ofertas exclusivas, seguimiento de pedidos y compras m\u00e1s r\u00e1pidas."
      />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Registrarse</h2>
          <p className="auth-subtitle">Crea tu cuenta para comprar más rápido y seguir tus pedidos.</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="Registrarse con Google" />
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Apellido</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => setEmailTouched(true)}
              required
              disabled={loading}
            />
            {emailTouched && formData.email && !validateEmail(formData.email) && (
              <small className="error">El correo ingresado no es válido. Verifica el formato: usuario@correo.com.</small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
