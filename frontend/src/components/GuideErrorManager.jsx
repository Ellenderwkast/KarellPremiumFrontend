import React, { useEffect, useState } from 'react';
import { guideErrorService } from '../services/guideErrorService';
import PageSizeSelect from './ui/PageSizeSelect';

export default function GuideErrorManager() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [detailModal, setDetailModal] = useState({ open: false, content: null, title: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchErrors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter === 'resolved') params.resolved = true;
      if (filter === 'unresolved') params.resolved = false;
      const res = await guideErrorService.list(params);
      setErrors(res.data);
    } catch (err) {
      setError('Error cargando errores de guía');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchErrors(); }, [filter]);

  const total = errors.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedErrors = errors.slice((page - 1) * pageSize, page * pageSize);

  const handleToggle = async id => {
    setLoading(true);
    setError(null);
    try {
      await guideErrorService.toggleResolved(id);
      await fetchErrors();
    } catch (err) {
      setError('Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar error de guía?')) return;
    setLoading(true);
    setError(null);
    try {
      await guideErrorService.remove(id);
      await fetchErrors();
    } catch (err) {
      setError('Error eliminando error');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = (raw) => {

  // Responsividad profesional para tabla de errores
  const TableContainer = ({ children }) => (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: 12 }}>
      <table style={{ minWidth: 600, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        {children}
      </table>
    </div>
  );

  // ...existing code...
    if (!raw) return;
    // raw may be an object, a JSON string, or some other string (e.g., XML)
    let content = null;
    try {
      if (typeof raw === 'string') {
      <TableContainer>
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Resuelto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagedErrors.map(err => (
            <tr key={err.id}>
              <td>{err.id}</td>
              <td>{err.description}</td>
              <td>{err.resolved ? 'Sí' : 'No'}</td>
              <td>
                {/* ...acciones... */}
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
      window.alert('No se pudo copiar');
    }
  };

  return (
    <div>
      <h3>Errores de guía</h3>
      <div className="admin-filters-row">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Todos</option>
          <option value="unresolved">No resueltos</option>
          <option value="resolved">Resueltos</option>
        </select>
        <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { setPageSize(v); setPage(1); }} storageKey="guide_errors_page_size" />
        <button onClick={fetchErrors} disabled={loading} className="admin-refresh-btn">Refrescar</button>
      </div>
      {error && <div className="admin-error-text">{error}</div>}
      <table className="admin-table admin-guide-errors-table">
        <thead>
          <tr>
            <th># Orden</th>
            <th># Envío</th>
            <th>Código</th>
            <th>Mensaje</th>
            <th>Detalles</th>
            <th>Resuelto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagedErrors.length > 0 ? pagedErrors.map(e => (
            <tr key={e.id}>
              <td>{e.orderId}</td>
              <td>{e.shipmentId || '-'}</td>
              <td>{e.code || '-'}</td>
              <td>{e.message}</td>
              <td className="guide-detail-cell">
                {e.details ? (
                  <button onClick={() => handleShowDetail(e.details)} className="guide-detail-btn" title="Ver detalle">Ver detalle</button>
                ) : ('-')}
              </td>
              <td>
                <button onClick={() => handleToggle(e.id)} className={`guide-toggle-btn ${e.resolved ? 'resolved' : 'unresolved'}`}>{e.resolved ? 'Sí' : 'No'}</button>
              </td>
              <td>
                <button onClick={() => handleDelete(e.id)} className="guide-delete-btn">Eliminar</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={7} className="table-empty">No hay errores registrados.</td></tr>
          )}
        </tbody>
      </table>
      {/* Paginación */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
          <span style={{ alignSelf: 'center' }}>Página {page} de {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page >= pageCount ? 'not-allowed' : 'pointer' }}>Siguiente</button>
        </div>
      )}
      {detailModal.open && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onKeyDown={(ev) => { if (ev.key === 'Escape') handleCloseDetail(); }}>
          <div className="admin-modal-overlay" onClick={handleCloseDetail} />
          <div className="admin-modal-card">
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>{detailModal.title}</h4>
              <div className="admin-modal-actions">
                <button onClick={handleCopyDetail} className="admin-modal-copy-btn">Copiar</button>
                <button onClick={handleCloseDetail} className="admin-modal-close-btn">Cerrar</button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #eef2ff', fontSize: 13 }}>{detailModal.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
