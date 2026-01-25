import React, { useState } from 'react';
import { shippingService } from '../services/api';

export default function CotizarCoordinadoraDemo() {
  const [form, setForm] = useState({
    nit: '',
    div: '',
    cuenta: '',
    producto: '',
    origen: '',
    destino: '',
    valoracion: '',
    apikey: '',
    clave: '',
    nivel_servicio: [],
    detalle: [
      { ubl: '', alto: '', ancho: '', largo: '', peso: '', unidades: '' }
    ]
  });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleDetalleChange = (i, e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      detalle: f.detalle.map((d, idx) => idx === i ? { ...d, [name]: value } : d)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const res = await shippingService.cotizarCoordinadora(form);
      setResultado(res.data.resultado);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Cotizar envío Coordinadora (Demo)</h2>
      <form onSubmit={handleSubmit}>
        <input name="nit" placeholder="NIT" value={form.nit} onChange={handleChange} required />
        <input name="div" placeholder="DIV" value={form.div} onChange={handleChange} required />
        <input name="cuenta" placeholder="Cuenta" value={form.cuenta} onChange={handleChange} required />
        <input name="producto" placeholder="Producto" value={form.producto} onChange={handleChange} required />
        <input name="origen" placeholder="Ciudad Origen (DANE8)" value={form.origen} onChange={handleChange} required />
        <input name="destino" placeholder="Ciudad Destino (DANE8)" value={form.destino} onChange={handleChange} required />
        <input name="valoracion" placeholder="Valor declarado" value={form.valoracion} onChange={handleChange} required />
        <input name="apikey" placeholder="API Key" value={form.apikey} onChange={handleChange} required />
        <input name="clave" placeholder="Clave" value={form.clave} onChange={handleChange} required />
        <h4>Detalle del paquete</h4>
        {form.detalle.map((d, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <input name="ubl" placeholder="UBL" value={d.ubl} onChange={e => handleDetalleChange(i, e)} required />
            <input name="alto" placeholder="Alto (cm)" value={d.alto} onChange={e => handleDetalleChange(i, e)} required />
            <input name="ancho" placeholder="Ancho (cm)" value={d.ancho} onChange={e => handleDetalleChange(i, e)} required />
            <input name="largo" placeholder="Largo (cm)" value={d.largo} onChange={e => handleDetalleChange(i, e)} required />
            <input name="peso" placeholder="Peso (kg)" value={d.peso} onChange={e => handleDetalleChange(i, e)} required />
            <input name="unidades" placeholder="Unidades" value={d.unidades} onChange={e => handleDetalleChange(i, e)} required />
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Cotizando...' : 'Cotizar'}
        </button>
      </form>
      {resultado && (
        <div style={{ marginTop: 20, background: '#f6f6f6', padding: 12, borderRadius: 6 }}>
          <h4>Resultado:</h4>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
