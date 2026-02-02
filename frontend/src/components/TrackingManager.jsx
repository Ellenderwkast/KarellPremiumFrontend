import React, { useEffect, useState } from 'react';
import { shipmentService } from '../services/shipmentService';
import api from '../services/api';
import InlineSpinner from './InlineSpinner';
import TableContainer from './TableContainer';
import PageSizeSelect from './ui/PageSizeSelect';
import './trackingManager.css';

export default function TrackingManager() {
  const [trackings, setTrackings] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ status: '', carrier: '', guide: '' });
  // Local controlled inputs for debounce / enter-to-search behavior
  const [statusInput, setStatusInput] = useState(filter.status || '');
  const [carrierInput, setCarrierInput] = useState(filter.carrier || '');
  const [guideInput, setGuideInput] = useState(filter.guide || '');
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [externalHref, setExternalHref] = useState(null);

  const formatEventDate = (v) => {
    if (!v) return '';
    try {
      // Aceptar strings ISO o timestamps numéricos
      const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
      if (isNaN(d.getTime())) return String(v);
      // Mostrar fecha y hora en formato local (es-CO)
      return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
      return String(v);
    }
  };

  const cleanEventMessage = (ev) => {
    let m = ev?.message || ev?.descripcion || ev?.description || '';
    if (!m) return '';
    if (typeof m !== 'string') m = JSON.stringify(m);
    // Reemplazar texto literal de fallback por una versión más limpia
    m = m.replace(/Refresco automático de tracking \(fallback\)/i, 'Refresco automático de tracking');
    return m;
  };

  const fetchTrackings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.carrier) params.carrier = filter.carrier;
      if (filter.guide) params.guide = filter.guide;
      // include pagination params (backend may ignore them) and call trackings endpoint
      params.page = page;
      params.pageSize = pageSize;
      const res = await api.get('/trackings', { params });
      const data = res?.data;
      if (Array.isArray(data)) {
        // Backend returned a raw array (no pagination). Paginar en cliente para
        // mostrar 10 por página como en otros submódulos.
        const totalCount = data.length || 0;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setTrackings(Array.isArray(data) ? data.slice(start, end) : []);
        setTotal(totalCount);
      } else {
        // Backend returned paginated object { rows, count }
        setTrackings(data?.rows || []);
        setTotal(Number(data?.count || (data?.rows?.length || 0)));
      }
    } catch (err) {
      setError('Error cargando trackings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrackings(); }, [filter, page, pageSize]);

  // Keep local inputs in sync when external filter changes
  useEffect(() => {
    setStatusInput(filter.status || '');
    setCarrierInput(filter.carrier || '');
    setGuideInput(filter.guide || '');
  }, [filter]);

  // Debounce applying the inputs to the real filter (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      // Only update if different
      if (statusInput !== filter.status || carrierInput !== filter.carrier || guideInput !== filter.guide) {
        setPage(1);
        setFilter({ status: statusInput, carrier: carrierInput, guide: guideInput });
      }
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusInput, carrierInput, guideInput]);

  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));

  const handleInput = e => {
    const { name, value } = e.target;
    setFilter(f => ({ ...f, [name]: value }));
  };

  const handleRefresh = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      await shipmentService.refreshTracking(orderId);
      await fetchTrackings();
    } catch (err) {
      setError('Error refrescando tracking');
    } finally {
      setLoading(false);
    }
  };

  // Refrescar todos los trackings actualmente listados (página actual)
  const handleRefreshAll = async () => {
    if (!trackings || trackings.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Llamadas en paralelo, usar Promise.allSettled para no fallar todo por uno
      const calls = trackings.map(t => shipmentService.refreshTracking(t.orderId));
      const results = await Promise.allSettled(calls);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn('Algunos refresh fallaron', failed);
        setError(`${failed.length} refresco(s) fallaron (ver consola)`);
      }
      // Volver a cargar la página actual
      await fetchTrackings();
    } catch (err) {
      setError('Error refrescando lista de trackings');
    } finally {
      setLoading(false);
    }
  };

  const handleShowEvents = async (id) => {
    setEventsLoading(true);
    setSelected(id);
    setEvents([]);
    try {
      const res = await api.get(`/trackings/${id}/events`);
      setEvents(res.data?.events || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  return (
    <div className="tracking-manager">
      <h3>Tracking de envíos</h3>
      <div className="tm-toolbar">
        <input name="status" value={statusInput} onChange={e => setStatusInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); setFilter({ status: statusInput, carrier: carrierInput, guide: guideInput }); } }} placeholder="Último evento" className="tm-input" />
        <input name="carrier" value={carrierInput} onChange={e => setCarrierInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); setFilter({ status: statusInput, carrier: carrierInput, guide: guideInput }); } }} placeholder="Transportadora" className="tm-input" />
        <input name="guide" value={guideInput} onChange={e => setGuideInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); setFilter({ status: statusInput, carrier: carrierInput, guide: guideInput }); } }} placeholder="Guía" className="tm-input" />
        <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { setPageSize(v); setPage(1); }} storageKey="tracking_page_size" />
        <button onClick={handleRefreshAll} disabled={loading} title="Refrescar todos los trackings mostrados" className="tm-btn tm-btn--ghost tm-btn--refresh">
          {loading ? (
            <InlineSpinner size={14} color="#fff" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M21 12a9 9 0 10-3 6.708" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v-4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="tm-btn-label">Refrescar lista</span>
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <TableContainer minWidth={320} tableStyle={{ borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
        <thead style={{ background: '#f1f5f9' }}>
          <tr>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}># Orden</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Guía</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Transportadora</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Estado</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Último evento</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Valor declarado</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Peso (kg)</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Dimensiones (cm)</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tracking</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {trackings.length > 0 ? trackings.map(t => (
            <tr key={t.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.orderId}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.guideNumber || '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.carrier}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.status}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.lastTrackingStatus || '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.declaredValue != null ? (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(t.declaredValue)) : '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.weightKg != null ? Number(t.weightKg).toFixed(3) : '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{t.dimensionsCm ? `${t.dimensionsCm.length}×${t.dimensionsCm.width}×${t.dimensionsCm.height}` : '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                {t.trackingUrl ? (
                  (() => {
                    const raw = String(t.trackingUrl || '').trim();
                    // Normalizar casos comunes:
                    // - Forzar https para sandbox.coordinadora.com
                    // - Si la URL es relativa (empieza por /vmi), convertirla en https://sandbox.coordinadora.com/vmi/...
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
                    // Forzar https for known sandbox domain
                    href = href.replace(/^http:\/\/sandbox\.coordinadora\.com/i, 'https://sandbox.coordinadora.com');
                    const openTracking = async (e) => {
                      e.preventDefault();
                      try {
                        // Preflight: intentar una petición HEAD para comprobar disponibilidad
                        let ok = true;
                        try {
                          const resp = await fetch(href, { method: 'HEAD', mode: 'cors' });
                          ok = resp && (resp.status >= 200 && resp.status < 400);
                        } catch (preErr) {
                          // fallo en preflight (CORS o red) -> permitir apertura pero avisar
                          ok = false;
                        }

                        // Guardar href para uso en modal
                        setExternalHref(href);

                        if (!ok) {
                          // Mostrar modal de eventos en vez de abrir directamente
                          try {
                            setEventsLoading(true);
                            setSelected(t.id);
                            const resp = await api.get(`/trackings/${t.id}/events`);
                            setEvents(resp.data?.events || []);
                          } catch (e) {
                            setEvents([]);
                          } finally {
                            setEventsLoading(false);
                          }
                          return;
                        }

                        // Abrir en nueva pestaña (con seguridad)
                        try {
                          window.open(href, '_blank', 'noopener');
                        } catch (err) {
                          window.location.href = href;
                        }
                      } catch (err) {
                        // En caso de error inesperado, navegar directamente
                        window.location.href = href;
                      }
                    };
                    return <a href={href} onClick={openTracking} target="_blank" rel="noopener noreferrer">Ver tracking</a>;
                  })()
                ) : '-'}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                <div className="tm-actions">
                  <button onClick={() => handleRefresh(t.orderId)} title="Refrescar tracking" disabled={loading} className="tm-btn tm-btn--primary">
                    {loading ? <InlineSpinner size={12} color="#fff" /> : null}
                    <span className="tm-btn-label">Refrescar</span>
                  </button>
                  <button onClick={() => handleShowEvents(t.id)} title="Ver eventos de tracking" className="tm-btn tm-btn--accent">
                    {eventsLoading && selected === t.id ? <InlineSpinner size={12} color="#fff" /> : null}
                    <span className="tm-btn-label">Eventos</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await shipmentService.recalculate(t.orderId);
                        await fetchTrackings();
                      } catch (err) {
                        // Mostrar mensaje detallado del servidor si existe
                        const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
                        // Si la respuesta indica que la guía ya existe, ofrecer forzar
                        const text = String(serverMsg || '').toLowerCase();
                        if (text.includes('la guía ya existe') || text.includes('use ?force=true') || text.includes('forzar')) {
                          const ok = window.confirm(`${serverMsg}\n\n¿Deseas forzar el recálculo? Esto sobrescribirá los valores actuales.`);
                          if (ok) {
                            try {
                              setLoading(true);
                              await shipmentService.recalculate(t.orderId, { force: true });
                              await fetchTrackings();
                              setError(null);
                            } catch (err2) {
                              const serverMsg2 = err2?.response?.data?.message || err2?.response?.data?.error || err2?.message || String(err2);
                              setError('Error recalculando shipment: ' + serverMsg2);
                            } finally {
                              setLoading(false);
                            }
                          } else {
                            setError(serverMsg);
                          }
                        } else {
                          setError('Error recalculando shipment: ' + serverMsg);
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    title="Recalcular metadatos de envío"
                    disabled={loading}
                    className="tm-btn tm-btn--warning"
                  >
                    {loading ? <InlineSpinner size={12} color="#fff" /> : null}
                    <span className="tm-btn-label">Recalcular</span>
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No hay trackings registrados.</td></tr>
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

          {selected && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setSelected(null); setEvents([]); } }}
        >
          {/* Backdrop */}
          <div
            onClick={() => { setSelected(null); setEvents([]); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)' }}
          />

          {/* Modal panel */}
          <div style={{ position: 'relative', width: 'min(920px, 96%)', maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 10px 30px rgba(2,6,23,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Eventos de tracking</h4>
              <button onClick={() => { setSelected(null); setEvents([]); }} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }} aria-label="Cerrar modal">✕</button>
            </div>

            {eventsLoading ? (
              <div style={{ padding: 12 }}>Cargando eventos...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length > 0 ? events.map((ev, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #eef2ff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 140, color: '#374151', fontSize: 13 }}>
                      <div style={{ fontWeight: 700 }}>{ev.status || ev.evento || ev.code || 'Evento'}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{formatEventDate(ev.at || ev.date || ev.fecha || ev.timestamp)}</div>
                    </div>
                    <div style={{ color: '#0f172a', fontSize: 14, whiteSpace: 'pre-wrap' }}>{cleanEventMessage(ev)}</div>
                  </div>
                )) : (
                  <div style={{ padding: 12 }}>No hay eventos registrados.</div>
                )}
              </div>
            )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
                {externalHref ? (
                  <button onClick={() => { try { window.open(externalHref, '_blank', 'noopener'); } catch { window.location.href = externalHref; } }} style={{ padding: '8px 14px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>Abrir tracking externo</button>
                ) : null}
                <button onClick={() => { setSelected(null); setEvents([]); setExternalHref(null); }} style={{ padding: '8px 14px', borderRadius: 8, background: '#e5e7eb', border: 'none', cursor: 'pointer' }}>Cerrar</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
