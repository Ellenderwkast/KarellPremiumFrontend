import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BadgePercent, Headset, ShieldCheck, Truck } from 'lucide-react';
import ProductList from '../components/ProductList';
import SearchBar from '../components/SearchBar';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import OptimizedImage from '../components/OptimizedImage';
import VariantCarousel from '../components/VariantCarousel';
import '../styles/home.css';
import '../styles/products.css';

function Home() {
  const location = useLocation();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('homePageActive'));
  }, [location.pathname]);

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Karell Premium',
    url: window.location.origin,
    logo: '/images/logo.webp',
    description: 'Tienda online de productos tecnológicos premium y accesorios de alta calidad en Colombia.',
    address: { '@type': 'PostalAddress', addressCountry: 'CO' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Spanish' }
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: window.location.origin } ]
  };

  return (
    <div className="home">
      <SEO
        title="Audífonos Bluetooth, Relojes Inteligentes y Accesorios Tecnológicos al Mejor Precio | Karell Premium"
        description="Compra audífonos Bluetooth, relojes inteligentes y accesorios tecnológicos con envío a CALI, BOGOTÁ, MEDELLIN y toda Colombia y pago contra entrega. Calidad premium y precios increíbles en Karell Premium. ¡Compra ahora!."
      />
      <StructuredData type="organization" data={organizationData} />
      <StructuredData type="breadcrumb" data={breadcrumbData} />
      {/* Datos estructurados de LocalBusiness para SEO local en Colombia */}
      <StructuredData
        type="localbusiness"
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Karell Premium",
          "image": "https://www.karellpremium.com.co/images/logo.webp",
          "@id": "https://www.karellpremium.com.co/",
          "url": "https://www.karellpremium.com.co/",
          "telephone": "+57 320 1234567",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Calle 123 #45-67",
            "addressLocality": "Bogotá",
            "addressRegion": "Cundinamarca",
            "postalCode": "110111",
            "addressCountry": "CO"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 4.710989,
            "longitude": -74.072092
          },
          "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "opens": "09:00",
            "closes": "19:00"
          }],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+57 320 1234567",
            "contactType": "customer service",
            "areaServed": "CO",
            "availableLanguage": ["Spanish"]
          }
        }}
      />
      {/* Datos estructurados de producto para rich snippets en Google */}
      <StructuredData
        type="product"
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Audífonos inalámbricos Karell Premium",
          "image": [
            "https://www.karellpremium.com.co/images/products/audifono1.jpg",
            "https://www.karellpremium.com.co/images/products/audifono2.jpg"
          ],
          "description": "Compra audífonos diademas inalámbricos, Bluetooth y accesorios tecnológicos con excelente calidad de sonido, diseños modernos y precios increíbles. Envíos rápidos a toda Colombia y domicilios contraentrega.",
          "brand": "Karell Premium",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "COP",
            "price": "199000",
            "availability": "https://schema.org/InStock"
          }
        }}
      />
      {/* ...header principal eliminado, solo botón de catálogo... */}
      {/* Botón de catálogo principal eliminado por solicitud */}
      <video className="video-bg" src="descubre/video22.mp4" autoPlay muted loop playsInline />

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-row-flex">
              <div className="hero-titles">
                <h1>Audífonos Bluetooth Inalámbricos y Accesorios Tecnológicos al Mejor Precio | Karell Premium</h1>
                <p>Descubre los mejores productos con los mejores precios</p>
              </div>
              <Link to="/products" className="btn btn-primary btn-lg hero-cta">Explorar productos</Link>
            </div>
            <div className="hero-search"><SearchBar /></div>
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="products-page">
          <div className="container">
            <div className="products-header"><h2 className="featured-products-title">Productos destacados</h2></div>
            <ProductList />
          </div>
        </div>
      </section>

      {/* Carousel de variantes solicitado: entre Productos destacados y Vive la experiencia */}
      <VariantCarousel interval={4500} />

      <section className="info-gallery">
        <div className="container">
          <h2>Vive la experiencia</h2>
          <div className="info-gallery-grid">
            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/running.webp" alt="Corriendo con audífonos" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Running & Deporte</h3>
                <p>Audífonos perfectos para tus entrenamientos más intensos</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/gym.webp" alt="Gimnasio con audífonos" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Gimnasio & Fitness</h3>
                <p>Sonido motivador para alcanzar tus metas</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/comodidad.webp" alt="Ciclismo con audífonos" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Comodos</h3>
                <p>Comodos para cualquier tipo de situación</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage className="water-image" src="descubre/lluvia.webp" alt="Resistentes al agua" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Resistentes al agua</h3>
                <p>Entrenamientos bajo la lluvia sin preocupaciones</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/bateria.webp" alt="Batería de larga duración" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Batería duradera</h3>
                <p>Hasta 30 horas de música sin interrupciones</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage className="noise-image" src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80" alt="Cancelación de ruido" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Cancelación de ruido</h3>
                <p>Sumérgete en tu música sin distracciones</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/meditacion.webp" alt="Yoga con música" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Yoga & Meditación</h3>
                <p>Sonido cristalino para tu práctica mindful</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage src="descubre/estudio.webp" alt="Trabajo y productividad" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Trabajo & Estudio</h3>
                <p>Concentración total con audio de alta calidad</p>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <OptimizedImage className="center-image" src="descubre/viaje.webp" alt="Viajes y aventuras" width="400" height="300" objectFit="cover" />
              </div>
              <div className="gallery-content">
                <h3>Viajes & Aventuras</h3>
                <p>Tu compañero ideal para cada travesía</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <h3><Truck className="feature-icon" aria-hidden="true" /> Envío rápido</h3>
              <p>Entrega en 2-5 días hábiles</p>
            </div>
            <div className="feature">
              <h3><BadgePercent className="feature-icon" aria-hidden="true" /> Precios bajos</h3>
              <p>Los mejores precios del mercado</p>
            </div>
            <div className="feature">
              <h3><ShieldCheck className="feature-icon" aria-hidden="true" /> Seguridad garantizada</h3>
              <p>Pago seguro y protegido</p>
            </div>
            <div className="feature">
              <h3><Headset className="feature-icon" aria-hidden="true" /> Soporte al cliente</h3>
              <p>Atención 24/7</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

