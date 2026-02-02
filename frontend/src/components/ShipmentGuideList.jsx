import React, { useEffect, useState } from 'react';
import { shipmentService } from '../services/shipmentService';
import InlineSpinner from './InlineSpinner';
import PageSizeSelect from './ui/PageSizeSelect';
import TableContainer from './TableContainer';

import { shippingStatusService } from '../services/shippingStatusService';

export default function ShipmentGuideList({ guides, loading, error, onRefresh, onCreateGuide, onVoid, page, pageSize, total, onPageChange, onPageSizeChange, filter, onFilterChange, creatingGuideId }) {
  const [voidingId, setVoidingId] = useState(null);
  const [statuses, setStatuses] = useState([]);
  // Estados internos del sistema
  const internalStatuses = [
    { code: 'pending_guide', name: 'Pendiente de guía', color: '#fbbf24' },
    { code: 'guide_created', name: 'Guía generada', color: '#818cf8' },
    { code: 'in_transit', name: 'En tránsito', color: '#38bdf8' },
    { code: 'delivered', name: 'Entregado', color: '#4ade80' },
    { code: 'cancelled', name: 'Cancelado', color: '#f87171' },
    { code: 'error', name: 'Error', color: '#f43f5e' }
  ];
  const [statusEdit, setStatusEdit] = useState({}); // { [orderId]: statusCode }
  const [statusSaving, setStatusSaving] = useState({}); // { [orderId]: boolean }
  const [statusError, setStatusError] = useState({}); // { [orderId]: string }

  useEffect(() => {
    let mounted = true;
    const fetchStatuses = async () => {
      try {
        const res = await shippingStatusService.list();
        // Filtrar activos y evitar duplicados con los internos
        let custom = Array.isArray(res.data) ? res.data.filter(s => s.active !== false) : [];
        // Mapear custom para asegurar que tengan color (si no, usar gris)
        custom = custom.map(s => ({ ...s, color: s.color || '#e5e7eb' }));
        const customCodes = new Set(custom.map(s => s.code));
        const merged = [
          ...internalStatuses.filter(s => !customCodes.has(s.code)),
          ...custom
        ];
        if (mounted) setStatuses(merged);
      } catch {
        // No bloquear la UI si falla
      }
    };
    fetchStatuses();
    return () => { mounted = false; };
  }, []);
  
  const handleVoid = async (orderId) => {
    if (!orderId) return;
    if (!confirm('¿Confirmas anular la guía para la orden ' + orderId + '? Esta acción no es reversible.')) return;
    try {
      setVoidingId(orderId);
      if (onVoid) {
        await onVoid(orderId);
      } else {
        await shipmentService.voidGuide(orderId);
      }
      // refrescar lista si el padre provee onRefresh
      if (onRefresh) await onRefresh();
      alert('Guía anulada correctamente');
    } catch (err) {
      console.error('Error anulando guía', err);
      alert('Error anulando guía: ' + (err?.response?.data?.message || err?.message || JSON.stringify(err)));
    } finally {
      setVoidingId(null);
    }
  };

  const [searchTerm, setSearchTerm] = useState(filter || '');

  useEffect(() => { setSearchTerm(filter || ''); }, [filter]);

  const triggerSearch = () => {
    if (typeof onFilterChange === 'function') onFilterChange(searchTerm);
  };

  // Usar componente compartido TableContainer para responsividad

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h4 style={{ margin: 0 }}>Guías generadas</h4>
          {/* Page size selector moved next to title (left side) */}
          {typeof onPageSizeChange === 'function' ? (
            <div style={{ marginLeft: 8 }}>
              <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { onPageSizeChange(v); }} storageKey="guides_page_size" selectStyle={{ minWidth: 44, padding: 1 }} />
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <form onSubmit={e => { e.preventDefault(); triggerSearch(); }} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Buscar por # orden, guía, estado..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', minWidth: 180, height: 36, fontSize: 15, boxSizing: 'border-box' }}
            disabled={loading}
            autoComplete="off"
          />
          <button type="submit" disabled={loading} title="Buscar" style={{ padding: '0 16px', height: 36, borderRadius: 8, background: '#e0e7ff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxSizing: 'border-box' }}>
            {loading ? <InlineSpinner size={14} color="#0f172a" /> : null}
            Buscar
          </button>
          </form>
        </div>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <TableContainer>
        <thead style={{ background: '#f1f5f9' }}>
          <tr>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}># Orden</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Guía</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Transportadora</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Estado</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tracking</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Último evento</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {guides && guides.length > 0 ? guides.map(g => (
            <tr key={g.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{g.orderId}</td>
              <td className="shipment-actions-cell">
                {g.guideNumber ? (
                  <>
                    {g.guideNumber}
                    <br />
                    <button
                      onClick={async () => {
                        try {
                          const res = await shipmentService.downloadGuidePdf(g.orderId);
                          const blob = new Blob([res.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch (err) {
                          alert('No se pudo descargar el PDF: ' + (err?.response?.data?.message || err.message));
                        }
                      }}
                      style={{ marginRight: 8, color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Ver PDF
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await shipmentService.downloadGuidePdf(g.orderId);
                          const blob = new Blob([res.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `guia-coordinadora-${g.orderId}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          alert('No se pudo descargar el PDF: ' + (err?.response?.data?.message || err.message));
                        }
                      }}
                      style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'underline', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Descargar
                    </button>
                  </>
                ) : <span style={{ color: '#888' }}>No generada</span>}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{g.carrier}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                {/* Mostrar color del estado seleccionado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <select
                    value={statusEdit[g.orderId] !== undefined ? statusEdit[g.orderId] : g.status}
                    onChange={async e => {
                      const newStatus = e.target.value;
                      setStatusEdit(prev => ({ ...prev, [g.orderId]: newStatus }));
                      setStatusSaving(prev => ({ ...prev, [g.orderId]: true }));
                      setStatusError(prev => ({ ...prev, [g.orderId]: '' }));
                      try {
                        await shipmentService.updateStatus(g.orderId, newStatus);
                        if (onRefresh) await onRefresh();
                      } catch (err) {
                        setStatusError(prev => ({ ...prev, [g.orderId]: 'Error al actualizar' }));
                      } finally {
                        setStatusSaving(prev => ({ ...prev, [g.orderId]: false }));
                      }
                    }}
                    disabled={statusSaving[g.orderId] || loading}
                    style={{
                      minWidth: 120,
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                      fontSize: 15,
                      background: (statuses.find(s => s.code === (statusEdit[g.orderId] !== undefined ? statusEdit[g.orderId] : g.status))?.color || '#e5e7eb'),
                      color: '#111',
                      fontWeight: 600
                    }}
                  >
                    {statuses.map(s => (
                      <option key={s.code} value={s.code} style={{ background: s.color, color: '#111' }}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {statusError[g.orderId] && <div style={{ color: 'red', fontSize: 13 }}>{statusError[g.orderId]}</div>}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                {g.trackingUrl ? (() => {
                  const raw = String(g.trackingUrl || '').trim();
                  let href = raw;
                  if (!href) href = '';
                  // Si empieza con '/' (ruta relativa) y contiene 'vmi', asumir sandbox coordinadora
                  if (href.startsWith('/') && href.includes('/vmi')) {
                    href = `https://sandbox.coordinadora.com${href}`;
                  }
                  // Si no tiene protocolo, pero contiene sandbox.coordinadora.com, forzar https://
                  if (!/^[a-z]+:\/\//i.test(href) && /sandbox\.coordinadora\.com/i.test(href)) {
                    href = `https://${href.replace(/^\/+/, '')}`;
                  }
                  // Si no tiene protocolo en general, añadir http:// como fallback
                  if (!/^[a-z]+:\/\//i.test(href)) {
                    href = `http://${href}`;
                  }
                  // Forzar https para sandbox
                  href = href.replace(/^http:\/\/sandbox\.coordinadora\.com/i, 'https://sandbox.coordinadora.com');

                  const openTracking = (e) => {
                    e.preventDefault();
                    try { window.open(href, '_blank', 'noopener'); } catch { window.location.href = href; }
                  };

                  return <a href={href} onClick={openTracking} target="_blank" rel="noopener noreferrer">Ver tracking</a>;
                })() : '-'}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{(statuses.find(s => s.code === g.lastTrackingStatus)?.name) || g.lastTrackingStatus || '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                {(() => {
                  const hasGuide = Boolean(g.guideNumber);
                  const isCancelled = g.status === 'cancelled';
                  const createDisabled = loading || creatingGuideId === g.orderId || !(!hasGuide && !isCancelled);
                  const voidDisabled = loading || voidingId === g.orderId || !hasGuide || isCancelled;

                  const createStyle = {
                    marginRight: 8,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: createDisabled ? '#ffffff' : '#f59e0b',
                    border: createDisabled ? '1px solid #e5e7eb' : 'none',
                    color: createDisabled ? '#6b7280' : '#fff',
                    fontWeight: '600',
                    cursor: createDisabled ? 'not-allowed' : 'pointer',
                    opacity: createDisabled ? 0.8 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  };

                  const voidStyle = {
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: voidDisabled ? '#ffffff' : '#ef4444',
                    border: voidDisabled ? '1px solid #e5e7eb' : 'none',
                    color: voidDisabled ? '#6b7280' : '#fff',
                    fontWeight: '600',
                    cursor: voidDisabled ? 'not-allowed' : 'pointer',
                    opacity: voidDisabled ? 0.8 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  };

                  // Use CSS classes instead of inline styles to keep markup clean
                  return (
                    <div className="shipment-action-group">
                      <button
                        className={`shipment-action-btn create`}
                        onClick={() => onCreateGuide ? onCreateGuide(g.orderId) : shipmentService.createGuide(g.orderId)}
                        disabled={createDisabled}
                        title={createDisabled ? 'Crear guía no disponible' : 'Crear guía'}
                      >
                        {creatingGuideId === g.orderId ? <><InlineSpinner size={14} color="#fff" /> Creando...</> : 'Crear guía'}
                      </button>

                      <button
                        className={`shipment-action-btn void`}
                        onClick={() => handleVoid(g.orderId)}
                        disabled={voidDisabled}
                        title={voidDisabled ? (isCancelled ? 'Guía ya anulada' : 'Anular no disponible') : 'Anular guía'}
                      >
                        {voidingId === g.orderId ? <InlineSpinner size={14} color="#fff" /> : null}
                        Anular guía
                      </button>
                    </div>
                  );
                })()}
              </td>
            </tr>
          )) : (
            <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No hay guías registradas.</td></tr>
          )}
        </tbody>
      </TableContainer>
      {/* Paginación */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
          <span style={{ alignSelf: 'center' }}>Página {page} de {Math.ceil(total / pageSize)}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(total / pageSize) || loading} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #ccc', background: '#fff', cursor: page >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer' }}>Siguiente</button>
        </div>
      )}
    </div>
  );
}
