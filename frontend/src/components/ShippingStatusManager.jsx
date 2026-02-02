import React, { useEffect, useState } from 'react';
import { shippingStatusService } from '../services/shippingStatusService';
import PageSizeSelect from './ui/PageSizeSelect';
import TableContainer from './TableContainer';
import './ShippingStatusManager.css';
import './adminForms.css';

export default function ShippingStatusManager() {
  const [statuses, setStatuses] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: null, name: '', code: '', description: '', color: '', order: 0 });
  const [editing, setEditing] = useState(false);

  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shippingStatusService.list();
      setStatuses(res.data);
    } catch (err) {
      setError('Error cargando estados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatuses(); }, []);

  const total = statuses.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedStatuses = statuses.slice((page - 1) * pageSize, page * pageSize);

  const handleInput = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'order' ? Number(value) : value }));
  };

  const handleEdit = status => {
    setForm({
      id: status.id,
      name: status.name,
      code: status.code,
      description: status.description || '',
      color: status.color || '',
      order: status.order || 0
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({ id: null, name: '', code: '', description: '', color: '', order: 0 });
    setEditing(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
        color: form.color,
        order: form.order
      };
      if (editing && form.id) {
        await shippingStatusService.update(form.id, payload);
      } else {
        await shippingStatusService.create(payload);
      }
      await fetchStatuses();
      handleCancel();
    } catch (err) {
      setError('Error guardando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar estado de envío?')) return;
    setLoading(true);
    setError(null);
    try {
      await shippingStatusService.remove(id);
      await fetchStatuses();
    } catch (err) {
      setError('Error eliminando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async id => {
    setLoading(true);
    setError(null);
    try {
      await shippingStatusService.toggleActive(id);
      await fetchStatuses();
    } catch (err) {
      setError('Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Estados de envío</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div className="admin-form-row status-form" style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
          <input name="name" className="form-input" value={form.name} onChange={handleInput} placeholder="Nombre" required style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc' }} />
          <input name="code" className="form-input small" value={form.code} onChange={handleInput} placeholder="Código" required style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc' }} />
          <input name="description" className="form-input" value={form.description} onChange={handleInput} placeholder="Descripción" style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc' }} />
          <input name="color" className="form-input small" value={form.color} onChange={handleInput} placeholder="Color (ej: #4ade80)" style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc' }} />
          <input name="order" className="form-input small" type="number" value={form.order} onChange={handleInput} placeholder="Orden" style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc', width: 70 }} />
          <button type="submit" className="form-button" disabled={loading} style={{ padding: '6px 16px', borderRadius: 5, background: '#4ade80', border: 'none', color: '#fff', fontWeight: 'bold' }}>{editing ? 'Actualizar' : 'Crear'}</button>
          {editing && <button type="button" onClick={handleCancel} className="form-button" style={{ padding: '6px 12px', borderRadius: 5, background: '#fbbf24', border: 'none', color: '#fff', fontWeight: 'bold' }}>Cancelar</button>}
        </div>
      </form>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { setPageSize(v); setPage(1); }} storageKey="shipping_status_page_size" selectStyle={{ minWidth: 44, padding: 1 }} />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <TableContainer tableClassName="shipping-status-table" minWidth={320}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Descripción</th>
            <th>Color</th>
            <th>Orden</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagedStatuses.length > 0 ? pagedStatuses.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.code}</td>
              <td>{s.description || '-'}</td>
              <td>
                {s.color ? <span className="color-badge" style={{ background: s.color }}>{s.color}</span> : '-'}
              </td>
              <td>{s.order}</td>
              <td>
                <button
                  onClick={() => handleToggle(s.id)}
                  className={s.active ? 'estado-activo' : 'estado-inactivo'}
                  style={{ minWidth: 50 }}
                >
                  {s.active ? 'Sí' : 'No'}
                </button>
              </td>
              <td className="acciones">
                <button onClick={() => handleEdit(s)} className="btn-editar">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="btn-eliminar">Eliminar</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No hay estados registrados.</td></tr>
          )}
        </tbody>
      </TableContainer>
      {/* Paginación */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
          <span style={{ alignSelf: 'center' }}>Página {page} de {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page >= pageCount ? 'not-allowed' : 'pointer' }}>Siguiente</button>
        </div>
      )}
    </div>
  );
}
