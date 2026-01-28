import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ReactDOM from 'react-dom';
import DispatchManager from '../components/DispatchManager';
import DispatchHistory from '../components/DispatchHistory';
import { dispatchService } from '../services/dispatchService';

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
      <div role="dialog" aria-modal="true" aria-label={title || 'Modal'} onClick={e => e.stopPropagation()} style={{width:'min(1000px,95%)',maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:8,boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #eee'}}>
          <h3 style={{margin:0}}>{title}</h3>
          <div>
            <button onClick={onClose} style={{border:'none',background:'transparent',fontSize:18,cursor:'pointer'}} aria-label="Cerrar">✕</button>
          </div>
        </div>
        <div style={{padding:16}}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminDespacho() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  const [active, setActive] = useState('recogida');
  const [modalOpen, setModalOpen] = useState(false);

  const submodules = [
    { key: 'recogida', label: 'Recogida' },
    { key: 'seguimiento', label: 'Seguimiento' }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Despacho</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {submodules.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: active === s.key ? '#e0e7ff' : '#fff',
              fontWeight: active === s.key ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, minHeight: 200 }}>
        {active === 'recogida' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 40 }}>
              <div>
                <strong>Recogidas</strong>
                <div style={{ color: '#666', fontSize: 13 }}>Programa nuevas recogidas o revisa el historial.</div>
              </div>
              <div>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
                >
                  + Programar recogida
                </button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <DispatchHistory />
            </div>

            <Modal open={modalOpen} title="Programar recogida" onClose={() => setModalOpen(false)}>
              <DispatchManager />
            </Modal>
          </div>
        )}

        {active === 'seguimiento' && (
          <div>
            <h3>Seguimiento de Recogida</h3>
            <div style={{ maxWidth: 680 }}>
              <p style={{ color: '#666' }}>Consulta el estado de una recogida por ID o referencia.</p>

              <SeguimientoForm />

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeguimientoForm() {
  const [idRecogida, setIdRecogida] = useState('');
  const [referencia, setReferencia] = useState('');
  // nit/div se obtienen del backend vía variables de entorno; ocultos en UI
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        id_recogida: idRecogida ? Number(idRecogida) : undefined,
        referencia: referencia || undefined
      };
      const res = await dispatchService.seguimientoPickup(payload);
      setResult(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 8, padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>
            ID Recogida
            <input value={idRecogida} onChange={e => setIdRecogida(e.target.value)} placeholder="26859531" style={{ width: '100%' }} />
          </label>
          <label style={{ flex: 1 }}>
            Referencia
            <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Referencia interna" style={{ width: '100%' }} />
          </label>
        </div>

        {/* NIT y Div ocultos: el backend usa las variables de entorno Nit/Div por defecto */}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>
            {loading ? 'Consultando...' : 'Consultar seguimiento'}
          </button>
        </div>
      </form>

      {error && <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 12 }}>
          <h4>Respuesta</h4>
          {renderFriendlyResult(result)}
        </div>
      )}
    </div>
  );
}

function renderFriendlyResult(result) {
  // result expected shape: { raw: '...', parsed: { ... } }
  const parsed = result.parsed || result;

  // Navigate to Recogidas_seguimientoResult in parsed regardless of namespace
  let recogida = null;
  try {
    const env = parsed['SOAP-ENV:Envelope'] || parsed['soapenv:Envelope'] || parsed['Envelope'] || parsed;
    const body = env && (env['SOAP-ENV:Body'] || env['soapenv:Body'] || env['Body']);
    const resp = body && (body['ns1:Recogidas_seguimientoResponse'] || body['Recogidas_seguimientoResponse'] || body['ser:Recogidas_seguimientoResponse']);
    recogida = resp && (resp['Recogidas_seguimientoResult'] || resp['return'] || resp['p'] || resp);
  } catch (e) {
    recogida = null;
  }

  if (!recogida) {
    // Fallback: show raw text in a small pre
    const raw = result.raw || JSON.stringify(result, null, 2);
    return (
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f6f8fa', padding: 12, borderRadius: 6 }}>{raw}</pre>
    );
  }

  const id = recogida.id_recogida || recogida.id || '';
  const codigo = recogida.codigo_estado || recogida.codigo || '';
  const descripcion = recogida.descripcion_estado || recogida.descripcion || '';
  const referencia = recogida.referencia || '';
  const guiasRaw = recogida.guias || recogida.guias?.item || '';
  let guias = [];
  if (Array.isArray(guiasRaw)) guias = guiasRaw;
  else if (typeof guiasRaw === 'string' && guiasRaw.trim()) guias = [guiasRaw];
  else if (typeof guiasRaw === 'object' && guiasRaw.item) guias = Array.isArray(guiasRaw.item) ? guiasRaw.item : [guiasRaw.item];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>
          {descripcion || (codigo ? `Estado ${codigo}` : 'Resultado')}
        </div>
        <div style={{ color: '#666' }}>Recogida <strong>#{id}</strong></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: 12, background: '#fff', border: '1px solid #eee', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: '#888' }}>Referencia</div>
          <div style={{ fontWeight: 600 }}>{referencia || '—'}</div>
        </div>
        <div style={{ padding: 12, background: '#fff', border: '1px solid #eee', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: '#888' }}>Código</div>
          <div style={{ fontWeight: 600 }}>{codigo || '—'}</div>
        </div>
      </div>

      <div style={{ padding: 12, background: '#fff', border: '1px solid #eee', borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: '#888' }}>Guías</div>
        {guias.length ? (
          <ul style={{ margin: '8px 0 0 16px' }}>
            {guias.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        ) : (
          <div style={{ color: '#666', marginTop: 6 }}>Sin guías asociadas</div>
        )}
      </div>

      <details style={{ background: '#fff', border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
        <summary style={{ cursor: 'pointer' }}>Ver respuesta RAW</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8 }}>{result.raw || JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}
