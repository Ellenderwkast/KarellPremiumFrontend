import React from 'react';
import { useNavigate } from 'react-router-dom';

function ContentsDashboard() {
  const navigate = useNavigate();
  return (
    <div className="admin-contents-dashboard">
      <h1>Gestión de Contenidos</h1>
      <div className="contents-actions">
        <button className="btn btn-primary" onClick={() => navigate('/admin/contents/new')}>Crear nueva publicación</button>
        <button className="btn btn-outline" onClick={() => navigate('/admin/contents/list')}>Ver todas las publicaciones</button>
      </div>
    </div>
  );
}

export default ContentsDashboard;
