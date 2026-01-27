import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ContentForm from './ContentForm';
import { createPost } from './api';

const isDev = import.meta.env.DEV;

function NewContent() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (data) => {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const resp = await createPost(data);
      if (isDev) console.log('createPost response', resp?.data || resp);
      setMsg('Publicación guardada correctamente');
      // Redirigir al listado después de una pequeña espera para que el usuario vea el mensaje
      setTimeout(() => navigate('/admin/contents/list'), 900);
    } catch (err) {
      console.error('createPost error', err);
      setErr(err?.response?.data?.error || err?.message || 'Error al guardar la publicación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-new-content">
      <ContentForm onSubmit={handleSubmit} />
      {saving && <div className="admin-message" style={{color:'#0c84ff'}}>Guardando...</div>}
      {msg && <div className="admin-message" style={{color:'green'}}>{msg}</div>}
      {err && <div className="admin-message" style={{color:'var(--danger-color)'}}>{err}</div>}
    </div>
  );
}

export default NewContent;
