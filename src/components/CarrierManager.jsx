import React, { useEffect, useState } from 'react';
import { carrierService } from '../services/carrierService';
import PageSizeSelect from './ui/PageSizeSelect';
import './CarrierManager.css';

export default function CarrierManager() {
  const [showConfig, setShowConfig] = useState(null); // Para modal de config
  const [carriers, setCarriers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: null, name: '', code: '', config: '' });
  const [editing, setEditing] = useState(false);

  const fetchCarriers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await carrierService.list();
      setCarriers(res.data);
    } catch (err) {
      setError('Error cargando transportadoras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCarriers(); }, []);

  // Derived pagination values
  const total = carriers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedCarriers = carriers.slice((page - 1) * pageSize, page * pageSize);

  const handleInput = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleEdit = carrier => {
    setForm({
      id: carrier.id,
      name: carrier.name,
      code: carrier.code,
      config: carrier.config ? JSON.stringify(carrier.config, null, 2) : ''
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({ id: null, name: '', code: '', config: '' });
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
        config: form.config ? JSON.parse(form.config) : null
      };
      if (editing && form.id) {
        await carrierService.update(form.id, payload);
      } else {
        await carrierService.create(payload);
      }
      await fetchCarriers();
      handleCancel();
    } catch (err) {
      setError('Error guardando transportadora');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar transportadora?')) return;
    setLoading(true);
    setError(null);
    try {
      await carrierService.remove(id);
      await fetchCarriers();
    } catch (err) {
      setError('Error eliminando transportadora');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async id => {
    setLoading(true);
    setError(null);
    try {
      await carrierService.toggleActive(id);
      await fetchCarriers();
    } catch (err) {
      setError('Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Transportadoras</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input name="name" value={form.name} onChange={handleInput} placeholder="Nombre" required style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc', minWidth: 120 }} />
          <input name="code" value={form.code} onChange={handleInput} placeholder="Código" required style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc', minWidth: 80 }} />
          <input name="config" value={form.config} onChange={handleInput} placeholder="Config (JSON opcional)" style={{ padding: 6, borderRadius: 5, border: '1px solid #ccc', minWidth: 180, fontFamily: 'monospace' }} />
          <button type="submit" disabled={loading} style={{ padding: '6px 16px', borderRadius: 5, background: '#4ade80', border: 'none', color: '#fff', fontWeight: 'bold' }}>{editing ? 'Actualizar' : 'Crear'}</button>
          {editing && <button type="button" onClick={handleCancel} style={{ padding: '6px 12px', borderRadius: 5, background: '#fbbf24', border: 'none', color: '#fff', fontWeight: 'bold' }}>Cancelar</button>}
        </div>
      </form>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <PageSizeSelect compact pageSize={pageSize} setPageSize={(v) => { setPageSize(v); setPage(1); }} storageKey="carrier_page_size" selectStyle={{ minWidth: 44, padding: 1 }} />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table className="carrier-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Config</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagedCarriers.length > 0 ? pagedCarriers.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.code}</td>
              <td
                style={{ fontFamily: 'monospace', fontSize: 13, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: c.config ? 'pointer' : 'default', color: c.config ? '#2563eb' : undefined }}
                title={c.config ? 'Haz clic para ver completo' : '-'}
                onClick={() => c.config && setShowConfig(JSON.stringify(c.config, null, 2))}
              >
                {c.config ? (JSON.stringify(c.config).length > 40 ? JSON.stringify(c.config).slice(0, 40) + '…' : JSON.stringify(c.config)) : '-'}
              </td>
              <td>
                <button
                  onClick={() => handleToggle(c.id)}
                  className={c.active ? 'estado-activo' : 'btn-eliminar'}
                  style={{ minWidth: 70 }}
                >
                  {c.active ? 'Activa' : 'Inactiva'}
                </button>
              </td>
              <td className="acciones">
                <button onClick={() => handleEdit(c)} className="btn-editar">Editar</button>
                <button onClick={() => handleDelete(c.id)} className="btn-eliminar">Eliminar</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No hay transportadoras registradas.</td></tr>
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
    {/* Modal para mostrar config completo */}
    {showConfig && (
      <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowConfig(null)}>
        <div style={{background:'#fff',borderRadius:'12px',boxShadow:'0 4px 32px #0002',padding:'2em',maxWidth:600,width:'90%',maxHeight:'80vh',overflow:'auto',fontFamily:'monospace',fontSize:15,whiteSpace:'pre-wrap',position:'relative'}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setShowConfig(null)} style={{position:'absolute',top:10,right:10,background:'#2563eb',color:'#fff',border:'none',borderRadius:6,padding:'4px 14px',fontWeight:600,cursor:'pointer'}}>Cerrar</button>
          <div style={{marginBottom:12,fontWeight:600}}>Config JSON</div>
          <pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{showConfig}</pre>
        </div>
      </div>
    )}
  </div>
  );
}
