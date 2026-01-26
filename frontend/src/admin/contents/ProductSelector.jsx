import React, { useEffect, useState } from 'react';
import api, { getStaticUrl } from '../../services/api';

function ProductSelector({ selectedProducts, setSelectedProducts }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  if (loading) return <div>Cargando productos...</div>;

  return (
    <div style={{margin:'1em 0'}}>
      <label style={{fontWeight:600, display: 'block', marginBottom: 8}}>Productos relacionados</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {products.map(prod => {
          const title = prod.title || prod.name || prod.attributes?.name || prod.attributes?.title || prod.attributes?.imageAlt || 'Sin título';
          const img = prod.attributes?.image || prod.image || (prod.images && prod.images[0]) || null;
          const selected = selectedProducts.includes(prod.id) || selectedProducts.includes(String(prod.id));
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => toggleProduct(prod.id)}
              style={{
                border: selected ? '2px solid #16a34a' : '1px solid #ccc',
                background: selected ? '#e6f9ed' : '#fff',
                borderRadius:10,
                padding:'0.45em 0.8em',
                cursor:'pointer',
                fontWeight:500,
                display:'inline-flex',
                alignItems:'center',
                gap:8,
                minWidth:120,
                textAlign:'left'
              }}
            >
              {img ? (
                <img src={getStaticUrl(img)} alt={title} style={{width:48,height:48,objectFit:'cover',borderRadius:6}} />
              ) : (
                <div style={{width:48,height:48,background:'#f3f4f6',borderRadius:6,display:'inline-block'}} />
              )}
              <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div style={{fontSize:14, fontWeight:600}}>{title}</div>
                <div style={{fontSize:12, color:'var(--gray-600)'}}>{prod.sku || prod.code || ''}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProductSelector;
