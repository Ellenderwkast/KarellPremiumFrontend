import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import '../styles/auth.css';
import SEO from '../components/SEO';

export default function CreateAccountFromOrder() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [form, setForm] = useState({ name, lastName: '', email, password: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const resp = await authService.createFromOrder(form);
      // set auth state and redirect to orders
      auth.login(resp.data.user, resp.data.token);
      navigate('/orders');
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.message || 'Error creando cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <SEO
        title="Crear cuenta desde tu pedido"
        description="Crea tu cuenta en Karell Premium para ver el historial y estado de tus pedidos realizados como invitado."
        robots="noindex, nofollow"
      />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Crear tu cuenta</h2>
          <p className="auth-subtitle">Regístrate para ver tu historial de compras y el estado de tus pedidos.</p>
        </div>
        {msg && <div className="auth-alert error">{msg}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nombre</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Tu nombre" />
            </div>
            <div className="form-field">
              <label>Apellido</label>
              <input name="lastName" value={form.lastName} onChange={handle} placeholder="Tu apellido" />
            </div>
          </div>
          <div className="form-field">
            <label>Email</label>
            <input name="email" value={form.email} onChange={handle} placeholder="tucorreo@ejemplo.com" />
          </div>
          <div className="form-field">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handle}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <button disabled={loading} type="submit" className="btn-primary">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <p className="auth-note">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link> para ver tu historial.
          </p>
        </form>
      </div>
    </div>
  );
}
