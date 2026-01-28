import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/api';
import ProductCard from './ProductCard';
import '../styles/productList.css';

const isDev = import.meta.env.DEV;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (isDev) console.log('Fetching products from API...');
      const response = await productService.getAll();
      if (isDev) console.log('Products fetched:', response.data);
      
      let allProducts = response.data;
      
      // Validar que allProducts sea un array
      if (!Array.isArray(allProducts)) {
        console.error('Validation failed - allProducts:', allProducts);
        setError('Error: La respuesta del servidor no es válida');
        setLoading(false);
        return;
      }

      // Normalize product attributes: prefer top-level image/colors, otherwise use attributes JSON
      allProducts = allProducts.map(p => {
        const attrs = p.attributes || {};
        return {
          ...p,
          image: p.image || attrs.image || null,
          colors: p.colors || attrs.colors || null,
          title: p.title || p.name || '',
          description: p.description || attrs.description || '',
          id: p.id || p._id || null
        };
      });

      // Filtrar por búsqueda si existe
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        allProducts = allProducts.filter(
          product => product.title?.toLowerCase().includes(term) || product.description?.toLowerCase().includes(term)
        );
      }

      setProducts(allProducts);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDev) console.log('ProductList mounted, fetching products...');
    fetchProducts();
    
    // Recargar cuando la página se vuelve visible (tab/window focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (isDev) console.log('Página visible, recargando productos...');
        fetchProducts();
      }
    };

    const handleFocus = () => {
      if (isDev) console.log('Window focused, recargando productos...');
      fetchProducts();
    };

    // Recargar cuando Home envía el evento personalizado
    const handleHomePageActive = () => {
      if (isDev) console.log('Home page active event, reloading products...');
      fetchProducts();
    };

    // Recargar cuando se crea/actualiza/elimina un producto en admin
    const handleProductChanged = () => {
      if (isDev) console.log('Product changed in admin, reloading products...');
      fetchProducts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('homePageActive', handleHomePageActive);
    window.addEventListener('productChanged', handleProductChanged);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('homePageActive', handleHomePageActive);
      window.removeEventListener('productChanged', handleProductChanged);
    };
  }, [searchTerm]);

  if (loading) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="product-list-wrapper">
      {searchTerm && (
        <div className="search-results-header">
          <h2>
            Resultados para: <span>"{searchTerm}"</span>
          </h2>
          <p>
            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      <div className="product-list">
        {products.length > 0 ? (
          products.map(product => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="no-products">
            {searchTerm ? `No hay productos que coincidan con "${searchTerm}"` : 'No hay productos disponibles'}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
