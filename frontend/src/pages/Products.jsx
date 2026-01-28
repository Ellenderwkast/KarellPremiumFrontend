import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductList from '../components/ProductList';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import '../styles/products.css';

function Products() {
  const navigate = useNavigate();
  
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: window.location.origin
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Productos',
        item: `${window.location.origin}/products`
      }
    ]
  };

  return (
    <div className="products-page">
      <SEO
        title="Productos"
        description="Explora nuestro catálogo completo de productos tecnológicos: audífonos, laptops, accesorios y más. Encuentra lo que buscas en Karell Premium."
      />
      <StructuredData type="breadcrumb-products" data={breadcrumbData} />
      <div className="container">
        <div className="products-header">
          <button className="back-button" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <h1>Todos nuestros productos</h1>
        </div>
        <ProductList />
      </div>
    </div>
  );
}

export default Products;
