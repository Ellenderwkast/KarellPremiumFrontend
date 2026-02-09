import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService, getStaticUrl } from '../services/api';
import { validateEmail, getEmailError } from '../utils/validation';
import '../styles/profile.css';
import { departments, citiesByDepartment } from '../data/colombiaCities';
import SEO from '../components/SEO';

const isDev = import.meta.env.DEV;
// Helper: normalizar y eliminar diacríticos
const normalizeDiacritics = s =>
  String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2019']/g, '')
    .replace(/\s+/g, ' ');

export default function Profile() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const user = auth.user || {};
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    documentType: '',
    document: '',
    avatar: '',
    note: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await authService.getProfile();
        const data = resp.data || {};
        if (isDev) console.log('Datos del perfil cargados:', data);
        setForm(prev => ({
          ...prev,
          name: data.name || '',
          lastName: data.lastName || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          department: data.department || '',
          documentType: data.documentType || '',
          document: data.document || '',
          avatar: data.avatar || '',
          note: data.note || ''
        }));
        setAvatarPreview(data.avatar || '');
        if (data && Object.keys(data).length) auth.setUser(data);
      } catch (e) {
        console.error('Error cargando perfil:', e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = e => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setAvatarFile(file);
      // Crear preview local temporal
      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);
      setAvatarError(false);
      setAvatarLoading(true);
    } else if (name === 'document') {
      // Solo permitir números
      const numericValue = value.replace(/[^0-9]/g, '');
      setForm(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const save = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    // Validate email
    const emailError = getEmailError(form.email);
    if (emailError) {
      setMsg(emailError);
      setLoading(false);
      return;
    }
    try {
      // Si hay archivo de avatar, enviar multipart/form-data
      let resp;
      if (avatarFile) {
        const fd = new FormData();
        Object.keys(form).forEach(k => {
          // No incluir avatar en FormData, solo los otros campos
          if (k === 'avatar') return;
          fd.append(k, form[k] || '');
        });
        fd.append('avatar', avatarFile);
        if (isDev) console.log('Enviando FormData con archivo de avatar');
        resp = await authService.updateProfile(fd);
      } else {
        if (isDev) console.log('Enviando datos sin archivo');
        resp = await authService.updateProfile({ ...form });
      }

      if (isDev) console.log('Respuesta del servidor:', resp.data);

      // Actualizar el estado del usuario con la respuesta del servidor
      const updatedUser = resp.data;

      // Mantener el token actual al actualizar el usuario
      const currentToken = auth.token;
      auth.login(updatedUser, currentToken);

      // Actualizar el formulario con los datos del servidor
      setForm({
        name: updatedUser.name || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        city: updatedUser.city || '',
        department: updatedUser.department || '',
        documentType: updatedUser.documentType || '',
        document: updatedUser.document || '',
        avatar: updatedUser.avatar || '',
        note: updatedUser.note || ''
      });

      // Actualizar el preview del avatar con la URL del servidor
      if (updatedUser.avatar) {
        setAvatarPreview(updatedUser.avatar);
      }

      setMsg('Perfil actualizado correctamente');
      setAvatarFile(null);
    } catch (err) {
      console.error('Error al actualizar:', err);
      setMsg(err.response?.data?.message || 'Error actualizando perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Mi cuenta"
        description="Gestiona tus datos personales, contacto y dirección en Karell Premium."
        robots="noindex, nofollow"
      />
      <div className="profile-container">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Volver al inicio
        </button>
        <h2 className="profile-title">Mi cuenta</h2>
      </div>
      {msg && <div className="profile-message">{msg}</div>}

      <form className="profile-grid" onSubmit={save}>
        <aside className="profile-aside">
          <div className="avatar-wrap">
            <div className="avatar-container">
              {avatarLoading && !avatarError && <div className="avatar-loading">Cargando...</div>}
              {avatarError ? (
                <div className="avatar-placeholder">
                  <span className="avatar-icon" aria-hidden="true"><User /></span>
                </div>
              ) : (
                <img
                  src={
                    (() => {
                      // Si hay preview local (blob), usarlo directamente
                      if (avatarPreview && avatarPreview.startsWith('blob:')) {
                        if (isDev) console.log('Avatar URL (blob):', avatarPreview);
                        return avatarPreview;
                      }
                      
                      // Si hay avatarPreview del servidor
                      if (avatarPreview) {
                        const url = getStaticUrl(avatarPreview);
                        if (isDev) console.log('Avatar URL (preview):', url, 'original:', avatarPreview);
                        return url;
                      }
                      
                      // Si hay avatar en el form
                      if (form.avatar) {
                        const url = getStaticUrl(form.avatar);
                        if (isDev) console.log('Avatar URL (form):', url, 'original:', form.avatar);
                        return url;
                      }
                      
                      // Fallback a placeholder
                      if (isDev) console.log('Avatar URL: usando placeholder');
                      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent((form.name || 'User') + ' ' + (form.lastName || '')) + '&size=120&background=667eea&color=fff';
                    })()
                  }
                  alt="avatar"
                  className="avatar-img"
                  onLoad={() => setAvatarLoading(false)}
                  onError={e => {
                    console.error('Error cargando avatar:', e.target.src);
                    setAvatarLoading(false);
                    setAvatarError(true);
                  }}
                  style={{ display: avatarLoading ? 'none' : 'block' }}
                />
              )}
              <div className="avatar-upload-icon" aria-hidden="true"><Upload /></div>
              <input type="file" name="avatar" accept="image/*" onChange={handle} className="avatar-input" />
            </div>
          </div>
          <div className="meta">
            <div>
              <strong>
                {form.name} {form.lastName}
              </strong>
            </div>
            <div className="muted">{form.email}</div>
            <div className="muted">{form.company}</div>
          </div>
        </aside>

        <section className="profile-main">
          <div className="row">
            <div className="field">
              <label>Nombre</label>
              <input name="name" value={form.name} onChange={handle} />
            </div>
            <div className="field">
              <label>Apellido</label>
              <input name="lastName" value={form.lastName} onChange={handle} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Email</label>
              <input name="email" value={form.email} onChange={handle} readOnly />
              {form.email && !validateEmail(form.email) && (
                <span className="field-error">{getEmailError(form.email)}</span>
              )}
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input name="phone" value={form.phone} onChange={handle} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Tipo Documento</label>
              <select name="documentType" value={form.documentType} onChange={handle}>
                <option value="">Selecciona tipo</option>
                <option value="CC">Cédula Ciudadanía</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="PA">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
            <div className="field">
              <label>Documento</label>
              <input type="text" name="document" value={form.document} onChange={handle} placeholder="Solo números" />
            </div>
          </div>

          <div className="row">
            <div className="field full">
              <label>Dirección</label>
              <input name="address" value={form.address} onChange={handle} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Departamento</label>
              <select name="department" value={form.department} onChange={handle}>
                <option value="">Selecciona departamento</option>
                {departments.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ciudad</label>
              <select name="city" value={form.city} onChange={handle} disabled={!form.department}>
                <option value="">Selecciona ciudad</option>
                {form.department && (() => {
                  const depCanonical = departments.find(d => normalizeDiacritics(d) === normalizeDiacritics(form.department)) || form.department;
                  const cities = citiesByDepartment[depCanonical] || [];
                  return cities.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field full">
              <label>Nota</label>
              <textarea name="note" value={form.note} onChange={handle} />
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Cancelar
            </button>
          </div>
        </section>
      </form>
    </div>
    </>
  );
}
