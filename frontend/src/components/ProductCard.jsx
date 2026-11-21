import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { getStaticUrl } from '../services/api';
import OptimizedImage from './OptimizedImage';
import { getVariantImageSources } from '../utils/productImagePresentation';
import { useSwipeNavigation } from '../utils/useSwipeNavigation';
import '../styles/productCard.css';

const getProductImageUrls = (product, variant = null) => [...new Set(
  getVariantImageSources(product, variant)
    .map(image => getStaticUrl(typeof image === 'string' ? image.trim() : image))
    .filter(Boolean)
)];

function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [imageAspectRatios, setImageAspectRatios] = useState({});

  // Verificar si el producto tiene variantes de color
  const colorVariants = (product.attributes?.colorVariants || []).map(v => ({
    ...v,
    stock: Number(v.stock) || 0
  }));
  const hasColorVariants = colorVariants.length > 0;

  // Establecer el color por defecto y las imágenes al montar el componente
  useEffect(() => {
    const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23eee" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial"%3ESin imagen%3C/text%3E%3C/svg%3E';
    if (hasColorVariants && !selectedColor) {
      setSelectedColor(colorVariants[0]);
      const variantImages = getProductImageUrls(product, colorVariants[0]);
      setImages(variantImages.length > 0 ? variantImages : [placeholderSvg]);
      setCurrentImageIndex(0);
    } else if (!hasColorVariants) {
      const productImages = getProductImageUrls(product);
      setImages(productImages.length > 0 ? productImages : [placeholderSvg]);
      setCurrentImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    images.forEach(src => {
      const preloadedImage = new window.Image();
      preloadedImage.src = src;
    });
  }, [images]);

  const availableStock = hasColorVariants
    ? Number(selectedColor?.stock ?? 0)
    : Number(product.stock ?? 0);

  const inc = () => setQuantity(q => Math.min(Math.max(availableStock, 1), q + 1));
  const dec = () => setQuantity(q => Math.max(1, q - 1));

  const handleColorChange = colorVariant => {
    setSelectedColor(colorVariant);
    setImages(getProductImageUrls(product, colorVariant));
    setCurrentImageIndex(0);
  };

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const swipeHandlers = useSwipeNavigation({
    enabled: images.length > 1,
    onPrevious: () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length),
    onNext: () => setCurrentImageIndex(prev => (prev + 1) % images.length)
  });

  const handleAddToCart = () => {
    const options = { quantity };
    if (selectedColor) {
      options.color = selectedColor.name;
      options.colorHex = selectedColor.hex;
    }
    addItem(product, options);
    setQuantity(1);
  };

  const productSlug = product.slug || product.id || product._id;
  const currentImage = images[currentImageIndex] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23eee" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial"%3ESin imagen%3C/text%3E%3C/svg%3E';
  const currentImageAspectRatio = imageAspectRatios[currentImage];
  const isAdaptiveImage = currentImageAspectRatio !== undefined && currentImageAspectRatio < 1.15;
  const productQuery = new URLSearchParams();
  if (selectedColor?.name) productQuery.set('color', selectedColor.name);
  productQuery.set('image', String(currentImageIndex));
  const productUrl = `/products/${productSlug}?${productQuery.toString()}`;
  const imageFrameClassNames = [
    'product-image',
    isAdaptiveImage ? 'product-image--adaptive' : '',
    images.length > 1 ? 'product-image--with-dots' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="product-card">
      <div
        className={imageFrameClassNames}
        {...swipeHandlers}
        style={isAdaptiveImage ? {
          '--product-image-ratio': currentImageAspectRatio
        } : undefined}
      >
        <Link
          to={productUrl}
          aria-label={`Ver producto ${product.title || product.name}`}
          className="product-image-link"
        >
          <OptimizedImage 
            src={currentImage}
            alt={`Comprar ${product.title || product.name} en Colombia | Audífonos y accesorios Karell Premium`}
            className="product-card-image"
            width="300"
            height="300"
            loading="eager"
            objectFit="contain"
            onDimensions={({ ratio }) => {
              setImageAspectRatios(previous => (
                previous[currentImage] === ratio
                  ? previous
                  : { ...previous, [currentImage]: ratio }
              ));
            }}
          />
        </Link>
        {images.length > 1 && (
          <>
            <button 
              className="carousel-btn carousel-prev" 
              onClick={prevImage}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button 
              className="carousel-btn carousel-next" 
              onClick={nextImage}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
            <div className="carousel-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`carousel-dot ${idx === currentImageIndex ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ir a imagen ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="product-info">
        <h2>{product.title || product.name}</h2>
        <p className="product-description" aria-hidden="true">{product.description ?? ''}</p>

        {hasColorVariants ? (
          <div className="color-selector">
            <span className="color-label">Color:</span>
            <div className="color-options">
              {colorVariants.map((variant, idx) => (
                <button
                  key={idx}
                  className={`color-option ${selectedColor?.name === variant.name ? 'active' : ''}`}
                  style={{ backgroundColor: variant.hex }}
                  onClick={() => handleColorChange(variant)}
                  title={variant.name}
                  aria-label={`Seleccionar color ${variant.name}`}
                >
                  {selectedColor?.name === variant.name && <span className="check-mark">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="color-selector color-selector-placeholder" aria-hidden="true" />
        )}

        <div className="product-footer">
          {availableStock > 0 ? (
            <span className="product-price">
              {`$${Number(product.price || 0).toLocaleString('es-CO')}`}
            </span>
          ) : (
            <span className="product-unavailable-note" role="status">
              <span className="product-unavailable-desktop">Producto no disponible</span>
              <span className="product-unavailable-mobile">No disponible</span>
            </span>
          )}
            <span className="product-stock">
              {hasColorVariants
                ? `${Number(selectedColor?.stock ?? 0)} disponibles`
                : `${product.stock != null ? `${product.stock} disponibles` : ''}`}
            </span>
        </div>

        <div className="product-controls">
          <div className="qty">
            <button className="qty-btn" onClick={dec} aria-label="decrease">
              -
            </button>
            <input
              className="qty-input"
              type="number"
              min="1"
              max={Math.max(1, availableStock)}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value || 1)))}
            />
            <button className="qty-btn" onClick={inc} aria-label="increase">
              +
            </button>
          </div>
          <div className="product-actions">
            <Link to={productUrl} className="btn btn-outline btn-sm">
              Ver
            </Link>
            <button
              onClick={handleAddToCart}
              className={`btn btn-primary btn-sm${availableStock === 0 ? ' agotado-btn' : ''}`}
              disabled={availableStock === 0}
            >
              {availableStock === 0 ? 'Agotado' : 'Agregar'}
            </button>
          </div>
        </div>
        {availableStock === 0 && <div className="out-of-stock out-of-stock-red">Agotado</div>}
      </div>
    </div>
  );
}

export default ProductCard;
