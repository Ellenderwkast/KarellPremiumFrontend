
import React, { useEffect, useState } from 'react';
import { retryService } from '../services/retryService';
import PageSizeSelect from './ui/PageSizeSelect';
import TableContainer from './TableContainer';
import './retryManager.css';
import './adminForms.css';

export default function RetryManager() {
  const [retries, setRetries] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: '', status: '', success: '' });
  const [detailsModal, setDetailsModal] = useState({ open: false, content: null, title: '' });

  const fetchRetries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.success) params.success = filter.success;
      const res = await retryService.list(params);
      setRetries(res.data);
    } catch {
      setError('Error cargando reintentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRetries(); }, [filter]); // fetchRetries no depende de nada externo

  const total = retries.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedRetries = retries.slice((page - 1) * pageSize, page * pageSize);

  const handleInput = e => {
    const { name, value } = e.target;
    setFilter(f => ({ ...f, [name]: value }));
  };

  const handleToggle = async id => {
    setLoading(true);
    setError(null);
    try {
      await retryService.toggleSuccess(id);
      await fetchRetries();
    } catch {
      setError('Error cambiando éxito');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar reintento?')) return;
    setLoading(true);
    setError(null);
    try {
      await retryService.remove(id);
      await fetchRetries();
    } catch {
      setError('Error eliminando reintento');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryNow = async id => {
    if (!window.confirm('¿Reintentar ahora?')) return;
    setError(null);
    setRowLoading(prev => ({ ...prev, [id]: true }));
    try {
      await retryService.retry(id);
      await fetchRetries();
    } catch (e) {
      setError('Error reintentando');
    } finally {
      setRowLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const openDetails = (title, content) => {
    let parsed = content;
    try {
      if (typeof content === 'string') parsed = JSON.parse(content);
    } catch (e) {
      // leave as string
    }
    setDetailsModal({ open: true, content: parsed, title });
  };

  const closeDetails = () => setDetailsModal({ open: false, content: null, title: '' });

  return (
    <div>
      <h3>Reintentos de guías/tracking</h3>
      <div className="retry-filters-row">
        <select name="type" className="form-input retry-select" value={filter.type} onChange={handleInput}>
          <option value="">Tipo</option>
          <option value="guide">Guía</option>
          <option value="tracking">Tracking</option>
        </select>
        <select name="status" className="form-input retry-select" value={filter.status} onChange={handleInput}>
          <option value="">Estado</option>
          <option value="pending">Pendiente</option>
          <option value="success">Éxito</option>
          <option value="failed">Fallido</option>
        </select>
        <select name="success" className="form-input retry-select" value={filter.success} onChange={handleInput}>
          <option value="">¿Exitoso?</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
        <button onClick={fetchRetries} className="form-button retry-refresh-btn" disabled={loading}>Refrescar</button>
        <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { setPageSize(v); setPage(1); }} storageKey="retry_page_size" />
      </div>
      {error && <div className="retry-error">{error}</div>}
      <TableContainer tableClassName="retry-table" minWidth={360}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>{'#\u00A0Orden'}</th>
            <th>{'#\u00A0Envío'}</th>
            <th>Acción</th>
            <th>Estado</th>
            <th>Intentos</th>
            <th>Mensaje</th>
            <th>Detalles</th>
            <th>¿Éxito?</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagedRetries.length > 0 ? pagedRetries.map(r => (
            <tr key={r.id}>
              <td>{r.type}</td>
              <td>
                {(() => {
                  // Try multiple sources to show the order number
                  const maybe = (v) => (v === null || v === undefined || v === '') ? null : v;
                  if (maybe(r.orderId)) return r.orderId;
                  if (maybe(r.order_id)) return r.order_id;
                  // Try parsing details which may include orderId or order
                  try {
                    const d = typeof r.details === 'string' ? (() => {
                      // details can contain multiple JSON blobs separated by newlines; try last
                      const parts = r.details.split(/\n+/).map(s => s.trim()).filter(Boolean);
                      const last = parts.length ? parts[parts.length - 1] : r.details;
                      return JSON.parse(last);
                    })() : r.details;
                    if (d) {
                      if (d.orderId) return d.orderId;
                      if (d.order && d.order.id) return d.order.id;
                      if (d.guideNumber && d.guideNumber.orderId) return d.guideNumber.orderId;
                    }
                  } catch (e) {
                    // ignore parse errors
                  }
                  return '-';
                })()}
              </td>
              <td>{r.shipmentId || '-'}</td>
              <td>{r.action}</td>
              <td>{r.status}</td>
              <td>{r.attempts}</td>
              <td>{r.message || '-'}</td>
              <td className="retry-details-cell">
                {r.details ? (
                  <button className="details-btn" onClick={() => openDetails('Detalles', r.details)}>Ver detalles</button>
                ) : (
                  <span style={{ color: '#888' }}>-</span>
                )}
              </td>
              <td>
                <button onClick={() => handleToggle(r.id)} className={r.success ? 'retry-success-btn' : 'retry-fail-btn'}>{r.success ? 'Sí' : 'No'}</button>
              </td>
              <td>
                <div className="retry-actions">
                  <button onClick={() => handleRetryNow(r.id)} disabled={!!rowLoading[r.id]} className="retry-action-btn retry-retrynow">
                    {rowLoading[r.id] ? (
                      <span className="retry-spinner" />
                    ) : null}
                    <span>{rowLoading[r.id] ? 'Reintentando' : 'Reintentar'}</span>
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="retry-action-btn retry-delete">Eliminar</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={10} className="retry-empty">No hay reintentos registrados.</td></tr>
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
      {detailsModal.open && (
        <div role="dialog" aria-modal="true" className="retry-modal-overlay" onClick={closeDetails}>
          <div onClick={e => e.stopPropagation()} className="retry-modal">
            <div className="retry-modal-header">
              <h4>{detailsModal.title}</h4>
              <button onClick={closeDetails} className="retry-modal-close">Cerrar</button>
            </div>
            <pre className="retry-modal-pre">{typeof detailsModal.content === 'string' ? detailsModal.content : JSON.stringify(detailsModal.content, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
