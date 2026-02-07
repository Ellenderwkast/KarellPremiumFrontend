
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WysiwygEditor from './WysiwygEditor';
import ProductSelector from './ProductSelector';
import { productService, getStaticUrl } from '../../services/api';

function ContentForm({ onSubmit, initialData, submitting = false }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [selectedProducts, setSelectedProducts] = useState(initialData?.products || []);
  // Ejemplo de categorías, en real deberías cargarlas desde la API
  const categories = [
    'Guías',
    'Comparativas',
    'Tendencias',
    'Preguntas frecuentes',
    'Errores comunes'
  ];
  // cover: puede venir como string ("/images/x.webp"), como objeto ({src,alt})
  // o como string JSON ('{"src":"/images/x.webp","alt":"..."}').
  const [cover, setCover] = useState(initialData?.cover || '');

  // Helper: intenta extraer una URL legible desde el valor original para mostrar en el input
  const resolveInitialCoverInput = (c) => {
    if (!c) return '';
    try {
      if (typeof c === 'string') {
        const s = c.trim();
        // caso: string JSON
        if (s.startsWith('{') && s.endsWith('}')) {
          try {
            const parsed = JSON.parse(s);
            return parsed.src || parsed.url || parsed.image || '';
          } catch (e) {
            // no fue JSON válido
          }
        }
        return s;
      }
      if (typeof c === 'object') {
        return c.src || c.url || c.image || '';
      }
    } catch (e) {
      // fallback
    }
    return '';
  };

  const [coverInput, setCoverInput] = useState(resolveInitialCoverInput(initialData?.cover || ''));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewData, setPreviewData] = useState('');
  const [content, setContent] = useState(initialData?.content || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [publishDate, setPublishDate] = useState(initialData?.publishDate || '');
  const [status, setStatus] = useState(initialData?.status || 'Publicado');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      category,
      cover,
      content,
      status,
      seoTitle,
      seoDescription,
      publishDate,
      products: selectedProducts
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadError('');
    // Preview local
    try {
      const reader = new FileReader();
      reader.onload = () => setPreviewData(reader.result);
      reader.readAsDataURL(file);
    } catch (err) {
      // ignore preview errors
    }

    // Upload to backend
    const form = new FormData();
    form.append('image', file);
    setUploading(true);
    try {
      const resp = await productService.uploadImage(form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = resp?.data?.url || resp?.url;
      if (url) setCover(url);
    } catch (err) {
      console.error('Upload error', err);
      setUploadError(err?.response?.data?.message || 'Error subiendo la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="content-form" onSubmit={handleSubmit}>
      <h2>{initialData ? 'Editar publicación' : 'Nueva publicación'}</h2>
      <label>Título</label>
      <input value={title} onChange={e => setTitle(e.target.value)} required />
      <label>Categoría</label>
      <select value={category} onChange={e => setCategory(e.target.value)} required>
        <option value="">Selecciona una categoría</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <label>Portada (URL)</label>
      <input value={coverInput} onChange={e => { setCoverInput(e.target.value); setCover(e.target.value); }} />
      <label style={{marginTop:12}}>Estado</label>
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="Publicado">Publicado</option>
        <option value="Borrador">Borrador</option>
      </select>
      <div style={{display:'flex',gap:12,alignItems:'center',marginTop:8}}>
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-start'}}>
          {uploading ? (
            <div style={{color:'var(--primary-color)'}}>Subiendo...</div>
          ) : (
            (() => {
              const source = previewData || cover || coverInput;
              // Si es string que parece JSON, parsear
              let resolved = source;
              if (typeof source === 'string') {
                const s = source.trim();
                if (s.startsWith('{') && s.endsWith('}')) {
                  try {
                    const p = JSON.parse(s);
                    resolved = p.src || p.url || p.image || '';
                  } catch (e) {
                    resolved = s;
                  }
                }
              }
              const url = getStaticUrl(resolved);
              return url ? (<img src={url} alt="Preview portada" style={{width:120,height:80,objectFit:'cover',borderRadius:6}} />) : null;
            })()
          )}
          {uploadError && <div style={{color:'var(--danger-color)'}}>{uploadError}</div>}
          {(previewData || cover) && (
            <div>
              <button
                type="button"
                className="btn-delete"
                onClick={() => {
                  if (window.confirm('¿Eliminar la portada? Esta acción quitará la imagen de la publicación (no la borrará del servidor).')) {
                    setCover('');
                    setPreviewData('');
                    setUploadError('');
                  }
                }}
                style={{marginTop:8}}
              >Eliminar portada</button>
            </div>
          )}
        </div>
      </div>

      <ProductSelector selectedProducts={selectedProducts} setSelectedProducts={setSelectedProducts} />
      <label>Contenido</label>
      <WysiwygEditor value={content} onChange={setContent} />
      <label>SEO Title</label>
      <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
      <label>SEO Description</label>
      <input value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
      <label>Fecha de publicación</label>
      <input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/admin/contents')}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ContentForm;
