import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { getStaticUrl } from '../services/api';
import OptimizedImage from './OptimizedImage';
import '../styles/productCard.css';

function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  // Verificar si el producto tiene variantes de color
  const colorVariants = (product.attributes?.colorVariants || []).map(v => ({
    ...v,
    stock: Number(v.stock) || 0
  }));
  const hasColorVariants = colorVariants.length > 0;

  // Establecer el color por defecto y las imágenes al montar el componente
  useEffect(() => {
    if (hasColorVariants && !selectedColor) {
      setSelectedColor(colorVariants[0]);
      const imgs = colorVariants[0].images || [colorVariants[0].image];
      setImages(imgs.map(getStaticUrl));
      setCurrentImageIndex(0);
    } else if (!hasColorVariants) {
      // Producto sin variantes de color
      const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23eee" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial"%3ESin imagen%3C/text%3E%3C/svg%3E';
      // Support both 'images' and legacy 'gallery' attribute
      const rawImages = product.attributes?.images || product.attributes?.gallery || [];
      const productImages = (Array.isArray(rawImages) && rawImages.length > 0)
        ? rawImages
        : [product.image || product.attributes?.image || placeholderSvg];
      // Filtrar entradas vacías y convertir a URL completas
      const mapped = productImages.filter(Boolean).map(getStaticUrl);
      setImages(mapped.length > 0 ? mapped : [placeholderSvg]);
      setCurrentImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableStock = hasColorVariants
    ? Number(selectedColor?.stock ?? 0)
    : Number(product.stock ?? 0);

  const inc = () => setQuantity(q => Math.min(Math.max(availableStock, 1), q + 1));
  const dec = () => setQuantity(q => Math.max(1, q - 1));

  const handleColorChange = colorVariant => {
    setSelectedColor(colorVariant);
    const imgs = colorVariant.images || [colorVariant.image];
    setImages(imgs.map(getStaticUrl));
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

  const handleAddToCart = () => {
    const options = { quantity };
    if (selectedColor) {
      options.color = selectedColor.name;
      options.colorHex = selectedColor.hex;
    }
    addItem(product, options);
    setQuantity(1);
  };

  const productId = product.id || product._id;
  
  // Construir URL con color seleccionado como query param
  const productUrl = selectedColor 
    ? `/products/${productId}?color=${encodeURIComponent(selectedColor.name)}`
    : `/products/${productId}`;

  return (
    <div className="product-card">
      <div className="product-image">
        <Link
          to={productUrl}
          aria-label={`Ver producto ${product.title || product.name}`}
          className="product-image-link"
        >
          <OptimizedImage 
            src={images[currentImageIndex] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23eee" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial"%3ESin imagen%3C/text%3E%3C/svg%3E'} 
            alt={`Comprar ${product.title || product.name} en Colombia | Audífonos y accesorios Karell Premium`}
            className="product-card-image"
            width="300"
            height="300"
            objectFit="contain"
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
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
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
              Producto no disponible
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
