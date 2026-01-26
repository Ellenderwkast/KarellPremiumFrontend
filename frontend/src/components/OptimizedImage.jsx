import { useState } from 'react';

/**
 * Componente para servir imágenes WebP con fallback automático
 * Soporta lazy loading y múltiples tamaños responsive
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  loading = 'lazy',
  objectFit = 'cover',
  fallback = null
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fitMode, setFitMode] = useState(objectFit);

  if (!src) {
    return null;
  }

  // Detectar si la imagen es externa (Unsplash, etc.)
  const isExternal = src?.startsWith('http://') || src?.startsWith('https://');
  const isWebP = src?.endsWith('.webp');

  // Generar URLs WebP y fallback
  const getImageUrls = () => {
    // Si es data URI (SVG inline), devolverlo tal cual sin srcset
    if (src?.startsWith('data:')) {
      return { webp: src, fallback: src, srcset: null };
    }

    // Detectar si la imagen es externa (Unsplash, etc.)
    const isExternal = src?.startsWith('http://') || src?.startsWith('https://');
    const isWebP = src?.endsWith('.webp');

    if (isExternal) {
      // Para URLs externas (Unsplash), usar parámetros de optimización
      if (src.includes('unsplash.com')) {
        return {
          webp: `${src}&fm=webp&q=85`,
          fallback: `${src}&q=80`,
          srcset: [
            `${src}&fm=webp&w=400&q=85 400w`,
            `${src}&fm=webp&w=800&q=85 800w`,
            `${src}&fm=webp&w=1200&q=85 1200w`
          ].join(', ')
        };
      }
      // Para otras URLs externas, usarlas tal cual sin srcset
      return { webp: src, fallback: src, srcset: null };
    }

    // Para imágenes locales, no generar srcset a menos que sepamos que existen las variantes
    // Simplificar para evitar errores de srcset inválido
    if (isWebP) {
      return {
        webp: src,
        fallback: src.replace('.webp', '.png'),
        srcset: null // No usar srcset para imágenes individuales
      };
    }

    // Para otras imágenes locales, usar tal cual
    return {
      webp: src,
      fallback: src,
      srcset: null
    };
  };

  const urls = getImageUrls();
  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    try {
      const img = e?.target;
      if (img && img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        // If the source image is portrait (taller than wide), prefer 'contain'
        // to avoid unwanted cropping inside wide/cards. Otherwise keep requested mode.
        if (ratio < 1) setFitMode('contain');
        else setFitMode(objectFit || 'cover');
      }
    } catch (err) {
      // ignore and keep default
    }
  };

  // Si la fuente es un data URI (placeholder SVG/PNG), no usar <picture>/<source>
  // porque algunos navegadores generan advertencias al incluir data URIs en srcset.
  // Renderizar directamente un <img> simple en ese caso.
  if (src.startsWith('data:')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          objectFit: fitMode,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    );
  }

  // Si hay error y existe fallback, mostrarlo
  if (imageError && fallback) {
    return fallback;
  }

  // Para imágenes WebP locales, mostrar directamente sin source tag extra
    if (isWebP && !isExternal) {
    return (
      <img
        src={urls.webp}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            objectFit: fitMode,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
      />
    );
  }

  // Para otros casos, usar picture tag con source para WebP
  return (
    <picture>
      {/* Source WebP con srcset para responsive */}
      {!isWebP && (
        <source
          type="image/webp"
          srcSet={urls.srcset || urls.webp}
          sizes={sizes}
        />
      )}
      
      {/* Fallback para navegadores que no soportan WebP */}
      <img
        className={className}
        src={imageError ? urls.fallback : urls.webp}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          objectFit: fitMode,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          // Ajuste especial para tarjetas de producto: evitar recortes en móviles
          ...(fitMode === 'contain'
            ? (className?.includes('product-card-image') || className?.includes('cart-item-image')
                ? { width: '100%', height: 'auto', maxHeight: '100%' }
                : { width: 'auto', height: '100%' }
              )
            : { width: '100%', height: '100%' }
          )
        }}
      />
    </picture>
  );
};

export default OptimizedImage;
