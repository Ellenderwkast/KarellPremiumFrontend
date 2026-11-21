import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService, getStaticUrl } from '../services/api';
import OptimizedImage from './OptimizedImage';
import { getVariantImageSources } from '../utils/productImagePresentation';
import { useSwipeNavigation } from '../utils/useSwipeNavigation';
import './variantCarousel.css';

const getSlideImages = (product, variant) => [...new Set(
  getVariantImageSources(product, variant)
    .map(image => getStaticUrl(typeof image === 'string' ? image.trim() : image))
    .filter(Boolean)
)].slice(0, 3);

export default function VariantCarousel({ interval = 8000 }) {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await productService.getAll();
        if (!Array.isArray(response.data)) {
          throw new Error('La respuesta de productos no es válida');
        }

        const collected = [];
        for (const product of response.data) {
          const variants = Array.isArray(product.attributes?.colorVariants)
            ? product.attributes.colorVariants
            : [];
          const productVariants = variants.length > 0 ? variants : [null];

          for (const variant of productVariants) {
            const images = getSlideImages(product, variant);
            if (images.length > 0) {
              collected.push({ product, variant, images });
            }
          }
        }

        if (active) {
          setSlides(collected);
          setIndex(0);
        }
      } catch (error) {
        console.error('Error cargando el carrusel de productos:', error);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [index, interval, paused, slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const nextIndex = (index + 1) % slides.length;
    const urls = new Set([
      ...(slides[index]?.images || []),
      ...(slides[nextIndex]?.images || [])
    ]);
    urls.forEach(url => {
      const image = new window.Image();
      image.decoding = 'async';
      image.src = url;
    });
  }, [index, slides]);

  const previous = () => setIndex(current => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex(current => (current + 1) % slides.length);
  const swipeHandlers = useSwipeNavigation({
    enabled: slides.length > 1,
    onPrevious: previous,
    onNext: next
  });

  if (slides.length === 0) return null;

  return (
    <section className="variant-carousel" aria-label="Galería de productos">
      <div className="container variant-carousel-container">
        <button
          className="carousel-btn carousel-prev"
          aria-label="Grupo anterior de imágenes"
          onClick={previous}
          disabled={slides.length < 2}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          className="carousel-btn carousel-next"
          aria-label="Siguiente grupo de imágenes"
          onClick={next}
          disabled={slides.length < 2}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className="carousel-viewport"
          {...swipeHandlers}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
          }}
        >
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${index * 100}%)` }}
            aria-live="off"
          >
            {slides.map((slide, slideIndex) => {
              const productId = slide.product.id || slide.product._id || slide.product.slug;
              const query = new URLSearchParams();
              if (slide.variant?.name) query.set('color', slide.variant.name);

              return (
                <div className="carousel-page" key={`${productId}-${slide.variant?.name || 'product'}`}>
                  {slide.images.map((image, imageIndex) => {
                    query.set('image', String(imageIndex));
                    const productUrl = `/products/${productId}?${query.toString()}`;
                    return (
                      <div className="carousel-card" key={`${image}-${imageIndex}`}>
                        <Link to={productUrl} className="carousel-link">
                          <div className="carousel-image-wrap">
                            <OptimizedImage
                              src={image}
                              alt={`${slide.product.title || slide.product.name || 'Producto'}${slide.variant?.name ? ` - ${slide.variant.name}` : ''}, imagen ${imageIndex + 1}`}
                              objectFit="contain"
                              loading={
                                slideIndex === index || slideIndex === (index + 1) % slides.length
                                  ? 'eager'
                                  : 'lazy'
                              }
                            />
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
