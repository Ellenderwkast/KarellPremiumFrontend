// ...existing code...
// El campo Ciudad destino debe ir dentro del return del formulario, no antes de la declaración del componente ni de los useState.
import React, { useState } from 'react';
import ciudadesDaneFull from '../data/ciudadesDaneFull.json';
import { dispatchService } from '../services/dispatchService';
import './dispatchManager.css';

const SERVICES = [
  'Recogidas_programar',
  'Recogidas_programarAsync',
  'Recogidas_programarAlterna',
  'Recogidas_programarAlternaAsync',
  'Recogidas_seguimiento',
  'Recogidas_seguimientoAsync',
  'Recogidas_seguimientoExt',
  'Recogidas_seguimientoExtAsync',
  'Recogidas_seguimientoPorFecha',
  'Recogidas_seguimientoPorFechaAsync',
  'Recogidas_seguimientoFCDetalladoPorReferencia',
  'Recogidas_seguimientoFCDetalladoPorReferenciaAsync'
];

export default function DispatchManager() {
  const [service, setService] = useState(SERVICES[0]);
  const [fecha_recogida, setFechaRecogida] = useState('');
  const [ciudad_origen, setCiudadOrigen] = useState(import.meta.env.VITE_COORDINADORA_CIUDAD_ORIGEN || ciudadesDaneFull[0]?.codigo || '');
  const [ciudad_destino, setCiudadDestino] = useState('');
  const [nombre_destinatario, setNombreDestinatario] = useState('');
  const [nit_destinatario, setNitDestinatario] = useState('');
  const [direccion_destinatario, setDireccionDestinatario] = useState('');
  const [telefono_destinatario, setTelefonoDestinatario] = useState('');
  const [nombre_empresa, setNombreEmpresa] = useState('Karell Premium');
  const [nombre_contacto, setNombreContacto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [producto, setProducto] = useState('4');
  const [referencia, setReferencia] = useState('');
  const [nit_cliente, setNitCliente] = useState(import.meta.env.VITE_COORDINADORA_NIT || '1087204978');
  const [div_cliente, setDivCliente] = useState(import.meta.env.VITE_COORDINADORA_DIV || '00');
  const [persona_autoriza, setPersonaAutoriza] = useState('Ellender Castillo');
  const [telefono_autoriza, setTelefonoAutoriza] = useState('');
  const [valor_declarado, setValorDeclarado] = useState('0');
  const [unidades, setUnidades] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState(import.meta.env.VITE_COORDINADORA_ESTADO || '0');
  const [apikey, setApikey] = useState(import.meta.env.VITE_COORDINADORA_APIKEY || 'a733a8fa-8fff-410b-a0b4-c49e658d06cb');
  const [clave, setClave] = useState(import.meta.env.VITE_COORDINADORA_CLAVE || 'rG1nP2eZ7rY7qW5q');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        service,
        fecha_recogida,
        ciudad_origen,
        ciudad_destino,
        nombre_destinatario,
        nit_destinatario,
        direccion_destinatario,
        telefono_destinatario,
        nombre_empresa,
        nombre_contacto,
        direccion,
        telefono,
        producto,
        referencia,
        nit_cliente,
        div_cliente,
        persona_autoriza,
        telefono_autoriza,
        valor_declarado,
        unidades,
        observaciones,
        estado,
        apikey,
        clave
      };
      const res = await dispatchService.requestPickup(payload);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dispatch-manager">
      <h3>Despacho / Recogidas (Coordinadora)</h3>
      <form onSubmit={handleSubmit} className="dispatch-form">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Servicio</div>
          <div style={{ display: 'inline-block', marginTop: 6, padding: '6px 10px', borderRadius: 6, background: '#eef2ff', color: '#1e3a8a', fontWeight: 600 }}>Recogidas_programar</div>
        </div>
        <label>
          Fecha de recogida
          <input type="date" value={fecha_recogida} onChange={e => setFechaRecogida(e.target.value)} required />
        </label>
        <label>
          Ciudad destino
          <select value={ciudad_destino} onChange={e => setCiudadDestino(e.target.value)} required>
            <option value="">Seleccione ciudad</option>
            {ciudadesDaneFull
              .slice()
              .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
              .map(c => (
                <option key={c.codigo} value={c.codigo}>{c.nombre} ({c.codigo})</option>
              ))}
          </select>
        </label>
        <label>
          Nombre destinatario
          <input value={nombre_destinatario} onChange={e => setNombreDestinatario(e.target.value)} required />
        </label>
        <label>
          NIT destinatario
          <input value={nit_destinatario} onChange={e => setNitDestinatario(e.target.value)} required />
        </label>
        <label>
          Dirección destinatario
          <input value={direccion_destinatario} onChange={e => setDireccionDestinatario(e.target.value)} required />
        </label>
        <label>
          Teléfono destinatario
          <input value={telefono_destinatario} onChange={e => setTelefonoDestinatario(e.target.value)} required />
        </label>
        <label>
          Nombre empresa
          <input value={nombre_empresa} onChange={e => setNombreEmpresa(e.target.value)} required />
        </label>
        <label>
          Nombre contacto
          <input value={nombre_contacto} onChange={e => setNombreContacto(e.target.value)} required />
        </label>
        <label>
          Ciudad origen
          <select value={ciudad_origen} onChange={e => setCiudadOrigen(e.target.value)} required>
            <option value="">Seleccione ciudad</option>
            {ciudadesDaneFull.map(c => (
              <option key={c.codigo} value={c.codigo}>{c.nombre} ({c.codigo})</option>
            ))}
          </select>
        </label>
        <label>
          Dirección de recogida
          <input value={direccion} onChange={e => setDireccion(e.target.value)} required />
        </label>
        <label>
          Teléfono de recogida
          <input value={telefono} onChange={e => setTelefono(e.target.value)} required />
        </label>
        <label>
          Producto
          <select value={producto} onChange={e => setProducto(e.target.value)}>
            <option value="2">Mensajería</option>
            <option value="4">Mercancía</option>
          </select>
        </label>
        <label>
          Referencia
          <input value={referencia} onChange={e => setReferencia(e.target.value)} required />
        </label>
        <label>
          Persona autoriza
          <input value={persona_autoriza} onChange={e => setPersonaAutoriza(e.target.value)} required />
        </label>
        <label>
          Teléfono autoriza
          <input value={telefono_autoriza} onChange={e => setTelefonoAutoriza(e.target.value)} required />
        </label>
        <label>
          Valor declarado
          <input type="number" value={valor_declarado} onChange={e => setValorDeclarado(e.target.value)} required />
        </label>
        <label>
          Unidades
          <input type="number" value={unidades} onChange={e => setUnidades(e.target.value)} required />
        </label>
        <label>
          Observaciones
          <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} required />
        </label>
        <div className="actions">
          <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Solicitar recogida'}</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h4>Respuesta</h4>
          {(() => {
            // Buscar los datos en result.parsed si existen
            let data = result;
            if (result.parsed && typeof result.parsed === 'object') {
              // Buscar el nodo principal de la respuesta SOAP
              const body = result.parsed['SOAP-ENV:Envelope']?.['SOAP-ENV:Body'] || result.parsed['soapenv:Envelope']?.['soapenv:Body'] || result.parsed['Envelope']?.['Body'];
              const recogidaResp = body?.['ns1:Recogidas_programarResponse'] || body?.['ser:Recogidas_programarResponse'] || body?.['Recogidas_programarResponse'];
              const recogidaResult = recogidaResp?.['Recogidas_programarResult'] || recogidaResp?.['return'] || recogidaResp?.['p'];
              if (recogidaResult && typeof recogidaResult === 'object') {
                data = recogidaResult;
              }
            }
            // Mostrar error SOAP si existe Fault
            const fault = result.parsed?.['SOAP-ENV:Envelope']?.['SOAP-ENV:Body']?.['SOAP-ENV:Fault'];
            if (fault) {
              return (
                <table className="result-table" style={{width:'100%',borderCollapse:'collapse',marginTop:'1em',boxShadow:'0 2px 8px #eee',background:'#fff',borderRadius:'8px',overflow:'hidden'}}>
                  <thead>
                    <tr style={{background:'#d32f2f',color:'#fff'}}>
                      <th style={{padding:'10px 18px',border:'none',textAlign:'left',fontWeight:'600',fontSize:'1.08em'}}>Código error</th>
                      <th style={{padding:'10px 18px',border:'none',textAlign:'left',fontWeight:'600',fontSize:'1.08em'}}>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'10px 18px',border:'none',background:'#fff3f3',fontSize:'1.05em'}}>{fault.faultcode || '-'}</td>
                      <td style={{padding:'10px 18px',border:'none',background:'#fff3f3',fontSize:'1.05em'}}>{fault.faultstring || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              );
            } else if (data.id || data.mensaje || data.message) {
              return (
                <table className="result-table" style={{width:'100%',borderCollapse:'collapse',marginTop:'1em',boxShadow:'0 2px 8px #eee',background:'#fff',borderRadius:'8px',overflow:'hidden'}}>
                  <thead>
                    <tr style={{background:'#2563eb',color:'#fff'}}>
                      <th style={{padding:'10px 18px',border:'none',textAlign:'left',fontWeight:'600',fontSize:'1.08em'}}>ID</th>
                      <th style={{padding:'10px 18px',border:'none',textAlign:'left',fontWeight:'600',fontSize:'1.08em'}}>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'10px 18px',border:'none',background:'#f9f9fb',fontSize:'1.05em'}}>{data.id || '-'}</td>
                      <td style={{padding:'10px 18px',border:'none',background:'#f9f9fb',fontSize:'1.05em'}}>{data.mensaje || data.message || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              );
            } else {
              return (
                <div style={{marginTop:'1em',background:'#fff',borderRadius:'8px',boxShadow:'0 2px 8px #eee',padding:'12px'}}>
                  <strong>Respuesta completa:</strong>
                  <pre style={{fontSize:'0.98em',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(data, null, 2)}</pre>
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
