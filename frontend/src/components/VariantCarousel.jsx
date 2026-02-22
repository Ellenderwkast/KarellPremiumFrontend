import React, { useEffect, useState, useRef } from 'react';
import { productService, getStaticUrl } from '../services/api';
import OptimizedImage from './OptimizedImage';
import { Link } from 'react-router-dom';
import './variantCarousel.css';

export default function VariantCarousel({ interval = 8000 }) {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await productService.getAll();
        const products = res.data || [];

        const collected = [];

        for (const p of products) {
          const attrs = p.attributes || {};
          const variants = Array.isArray(attrs.colorVariants) ? attrs.colorVariants : [];

          // If variants exist, prefer them (one slide per variant)
          if (variants.length > 0) {
            for (const v of variants) {
              const imgs = Array.isArray(v.images) ? v.images.filter(Boolean) : [];
              // Fallback: if variant has no images, try product-level gallery
              const finalImgs = imgs.length ? imgs.slice(0, 3) : (Array.isArray(attrs.gallery) ? attrs.gallery.slice(0,3) : (Array.isArray(attrs.images) ? attrs.images.slice(0,3) : ([])));
              if (finalImgs.length > 0) {
                collected.push({ product: p, variant: v, images: finalImgs.slice(0,3) });
              }
            }
          } else {
            // No variants: use gallery/images or single image
            const gallery = Array.isArray(attrs.gallery)
              ? attrs.gallery.filter(Boolean)
              : (Array.isArray(attrs.images) ? attrs.images.filter(Boolean) : []);
            const mainImage = attrs.image || p.image;
            // Merge main image + gallery to always feed up to 3 slots
            const merged = [mainImage, ...gallery].filter(Boolean);
            const imgs = merged.length ? merged.slice(0, 3) : [];
            if (imgs.length > 0) collected.push({ product: p, variant: null, images: imgs });
          }
        }

        if (mounted) setSlides(collected);
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [slides, interval]);

  if (!slides || slides.length === 0) return null;

  const slide = slides[index];

  const buildProductUrl = () => {
    const base = `/products/${slide.product.id}`;
    if (slide.variant && slide.variant.name) {
      return `${base}?color=${encodeURIComponent(slide.variant.name)}`;
    }
    return base;
  };
  const prev = () => {
    clearInterval(timerRef.current);
    setIndex(i => (i - 1 + slides.length) % slides.length);
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slides.length), interval);
  };

  const next = () => {
    clearInterval(timerRef.current);
    setIndex(i => (i + 1) % slides.length);
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slides.length), interval);
  };

  return (
    <section className="variant-carousel">
      <div className="container" style={{ position: 'relative' }}>
        {/* Prev button */}
        <button className="carousel-btn carousel-prev" aria-label="Anterior" onClick={prev}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Next button */}
        <button className="carousel-btn carousel-next" aria-label="Siguiente" onClick={next}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="carousel-row">
          {slide.images.map((img, i) => (
            <div key={i} className="carousel-card">
              <Link to={buildProductUrl()} className="carousel-link">
                <div className="carousel-image-wrap">
                  {/** Normalize image paths (absolute/relative) via getStaticUrl */}
                  <OptimizedImage
                    src={getStaticUrl(img)}
                    alt={`${slide.product.title} ${slide.variant?.name || ''}`}
                    objectFit="contain"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
