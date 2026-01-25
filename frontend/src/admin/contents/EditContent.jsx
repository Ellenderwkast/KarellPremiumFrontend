import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ContentForm from './ContentForm';
import { updatePost, fetchPost } from './api';

const isDev = import.meta.env.DEV;

function EditContent(props) {
  const params = useParams();
  const id = props?.id || params?.id;
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const resp = await fetchPost(id);
        const data = resp?.data ?? resp;
        if (!mounted) return;
        setInitialData(data);
      } catch (err) {
        console.error('fetchPost error', err);
        if (!mounted) return;
        setError('No se pudo cargar la publicación.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleSubmit = async (data) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const resp = await updatePost(id, data);
      if (isDev) console.log('updatePost response', resp?.data || resp);
      setSuccess('Publicación actualizada correctamente');
      // redirigir al listado después de un breve retardo
      setTimeout(() => navigate('/admin/contents/list'), 900);
    } catch (err) {
      console.error('updatePost error', err);
      setError(err?.response?.data?.error || err?.message || 'Error al actualizar la publicación');
    } finally {
      setSaving(false);
    }
  };

  if (!id) return <div className="error">ID de publicación no proporcionado.</div>;
  if (loading) return <div className="loading">Cargando publicación...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-edit-content">
      <ContentForm onSubmit={handleSubmit} initialData={initialData || {}} submitting={saving} />
      {saving && <div className="admin-message" style={{color:'#0c84ff'}}>Guardando...</div>}
      {success && <div className="admin-message" style={{color:'green'}}>{success}</div>}
      {error && <div className="admin-message" style={{color:'var(--danger-color)'}}>{error}</div>}
    </div>
  );
}

export default EditContent;
