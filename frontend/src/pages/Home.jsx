import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, Headset, ShieldCheck, Truck } from 'lucide-react';
import ProductList from '../components/ProductList';
import SearchBar from '../components/SearchBar';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import OptimizedImage from '../components/OptimizedImage';
import VariantCarousel from '../components/VariantCarousel';
import { experienceCardService } from '../services/api';
import '../styles/home.css';
import '../styles/products.css';

const DEFAULT_EXPERIENCE_CARDS = [
  { defaultKey: 'running', title: 'Running & Deporte', description: 'Audífonos perfectos para tus entrenamientos más intensos', imageUrl: 'descubre/running.webp', imageAlt: 'Corriendo con audífonos', imagePosition: 'center' },
  { defaultKey: 'fitness', title: 'Gimnasio & Fitness', description: 'Sonido motivador para alcanzar tus metas', imageUrl: 'descubre/gym.webp', imageAlt: 'Gimnasio con audífonos', imagePosition: 'center' },
  { defaultKey: 'comfort', title: 'Cómodos', description: 'Cómodos para cualquier tipo de situación', imageUrl: 'descubre/comodidad.webp', imageAlt: 'Audífonos cómodos para el día a día', imagePosition: 'center' },
  { defaultKey: 'waterproof', title: 'Resistentes al agua', description: 'Entrenamientos bajo la lluvia sin preocupaciones', imageUrl: 'descubre/lluvia.webp', imageAlt: 'Audífonos resistentes al agua', imagePosition: '50% 12%' },
  { defaultKey: 'battery', title: 'Batería duradera', description: 'Hasta 30 horas de música sin interrupciones', imageUrl: 'descubre/bateria.webp', imageAlt: 'Batería de larga duración', imagePosition: 'center' },
  { defaultKey: 'noise-cancelling', title: 'Cancelación de ruido', description: 'Sumérgete en tu música sin distracciones', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80', imageAlt: 'Audífonos con cancelación de ruido', imagePosition: '50% 40%' },
  { defaultKey: 'meditation', title: 'Yoga & Meditación', description: 'Sonido cristalino para tu práctica mindful', imageUrl: 'descubre/meditacion.webp', imageAlt: 'Yoga y meditación con música', imagePosition: 'center' },
  { defaultKey: 'work-study', title: 'Trabajo & Estudio', description: 'Concentración total con audio de alta calidad', imageUrl: 'descubre/estudio.webp', imageAlt: 'Audífonos para trabajo y estudio', imagePosition: 'center' },
  { defaultKey: 'travel', title: 'Viajes & Aventuras', description: 'Tu compañero ideal para cada travesía', imageUrl: 'descubre/viaje.webp', imageAlt: 'Viajes y aventuras con audífonos', imagePosition: '50% 25%' }
];

function Home() {
  const [experienceCards, setExperienceCards] = useState(DEFAULT_EXPERIENCE_CARDS);

  useEffect(() => {
    let active = true;
    experienceCardService.getPublic()
      .then(response => {
        if (!Array.isArray(response.data)) {
          throw new Error('La respuesta de tarjetas de experiencia no es válida');
        }
        if (active) setExperienceCards(response.data);
      })
      .catch(error => {
        console.error('Error cargando la sección Vive la experiencia:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Inicio', item: window.location.origin } ]
  };

  return (
    <div className="home">
      <SEO
        title="Audífonos Bluetooth y Accesorios Tecnológicos al Mejor Precio Colombia"
        description="Compra audífonos Bluetooth, relojes inteligentes y accesorios tecnológicos en Colombia. Envíos rápidos, pago contra entrega y garantía."
        appendBrand={false}
      />
      <StructuredData type="breadcrumb" data={breadcrumbData} />
      {/* ...header principal eliminado, solo botón de catálogo... */}
      {/* Botón de catálogo principal eliminado por solicitud */}
      <video className="video-bg" src="descubre/video22.mp4" autoPlay muted loop playsInline />

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-row-flex">
              <div className="hero-titles">
                <h1 className="sr-only">Audífonos Bluetooth y Accesorios Tecnológicos al Mejor Precio Colombia</h1>
                <p className="hero-description">
                  <span className="hero-copy">Descubre los mejores productos con los mejores</span>{' '}
                  <span className="hero-price-desktop">precios</span>
                </p>
                <span className="hero-price-mobile">precios</span>
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

      {experienceCards.length > 0 && (
        <section className="info-gallery">
          <div className="container">
            <h2>Vive la experiencia</h2>
            <div className="info-gallery-grid">
              {experienceCards.map(card => (
                <article className="gallery-item" key={card.id || card.defaultKey}>
                  <div className="gallery-image">
                    <OptimizedImage
                      src={card.imageUrl}
                      alt={card.imageAlt || card.title}
                      width="400"
                      height="300"
                      objectFit="cover"
                      objectPosition={card.imagePosition || 'center'}
                      forceObjectFit
                    />
                  </div>
                  <div className="gallery-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
