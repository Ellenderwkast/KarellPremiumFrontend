import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productService, productInterestService, reviewService, getStaticUrl } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import OptimizedImage from '../components/OptimizedImage';
import '../styles/productDetail.css';
import { renderDescription } from '../utils/renderDescription.jsx';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [interestName, setInterestName] = useState('');
  const [interestWhatsapp, setInterestWhatsapp] = useState('');
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState('');
  const [interestError, setInterestError] = useState('');

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ count: 0, average: 0 });

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewFormError, setReviewFormError] = useState('');

  // Verificar si el producto tiene variantes de color
  const colorVariants = product?.attributes?.colorVariants || [];
  const hasColorVariants = colorVariants.length > 0;

  useEffect(() => {
    if (!product?.id || typeof product.id !== 'number') return;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError('');
        const res = await reviewService.listByProduct(product.id);
        const data = res.data || {};
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setReviewsSummary(data.summary || { count: 0, average: 0 });
      } catch (err) {
        console.error('Error cargando reseñas:', err);
        setReviewsError(err?.response?.data?.message || 'No se pudieron cargar las reseñas');
        setReviews([]);
        setReviewsSummary({ count: 0, average: 0 });
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getById(slug);
        if (!response.data || !response.data.id) {
          setError('El producto no existe o no está disponible');
          setProduct(null);
          setLoading(false);
          return;
        }
        const fetchedProduct = response.data;
        setProduct(fetchedProduct);

        // Leer el color desde query params
        const colorFromUrl = searchParams.get('color');

        // Establecer imagen y color por defecto
        let variants = (fetchedProduct.attributes?.colorVariants || []).map(v => ({
          ...v,
          stock: Number(v.stock) || 0
        }));

        if (variants.length > 0) {
          const targetColor = colorFromUrl
            ? variants.find(v => v.name === colorFromUrl) || variants[0]
            : variants[0];
          setSelectedColor(targetColor);
          const colorImages = (targetColor.images || [targetColor.image]).map(getStaticUrl);
          setImages(colorImages);
          setCurrentImage(colorImages[0]);
          setCurrentImageIndex(0);
        } else {
          const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23eee" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial"%3ESin imagen%3C/text%3E%3C/svg%3E';
          const rawImages = fetchedProduct.attributes?.images;
          const hasImages = Array.isArray(rawImages) && rawImages.filter(Boolean).length > 0;
          const productImages = (hasImages ? rawImages : [
            fetchedProduct.image || fetchedProduct.attributes?.image || placeholder
          ]).filter(Boolean).map(getStaticUrl);
          setImages(productImages);
          setCurrentImage(productImages[0]);
          setCurrentImageIndex(0);
        }
      } catch (err) {
        const errorMsg = err.response?.status === 404
          ? 'El producto no existe'
          : err.message || 'Error al cargar el producto';
        setError(errorMsg);
        setProduct(null);
        console.error('Error cargando producto:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, searchParams]);

  // ...existing code...

  const myReview = isAuthenticated && user?.id
    ? reviews.find(r => Number(r.userId) === Number(user.id))
    : null;

  useEffect(() => {
    if (!isAuthenticated) {
      setReviewRating(5);
      setReviewComment('');
      return;
    }
    if (myReview) {
      setReviewRating(Number(myReview.rating) || 5);
      setReviewComment(myReview.comment || '');
    } else {
      setReviewRating(5);
      setReviewComment('');
    }
    // Solo cuando cambia la reseña propia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id, isAuthenticated]);

  const handleColorChange = colorVariant => {
    setSelectedColor(colorVariant);
    const colorImages = (colorVariant.images || [colorVariant.image]).map(getStaticUrl);
    setImages(colorImages);
    setCurrentImage(colorImages[0]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(newIndex);
    setCurrentImage(images[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setCurrentImage(images[newIndex]);
  };

  const handleAddToCart = () => {
    const options = { quantity };
    if (selectedColor) {
      options.color = selectedColor.name;
      options.colorHex = selectedColor.hex;
    }
    addItem(product, options);
    alert(`Producto agregado al carrito${selectedColor ? ` (Color: ${selectedColor.name})` : ''}`);
    setQuantity(1);
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();
    if (!product?.id) return;
    try {
      setInterestSubmitting(true);
      setInterestError('');
      setInterestSuccess('');
      const res = await productInterestService.create({
        productId: product.id,
        name: interestName,
        whatsapp: interestWhatsapp
      });
      setInterestSuccess(res.data?.message || 'Listo. Te contactaremos por WhatsApp cuando haya disponibilidad.');
      setInterestName('');
      setInterestWhatsapp('');
    } catch (err) {
      console.error('Error enviando interés:', err);
      setInterestError(err?.response?.data?.message || 'No se pudo enviar la solicitud');
    } finally {
      setInterestSubmitting(false);
    }
  };

  const renderStars = (value) => {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    return (
      <span className="review-stars" aria-label={`${v} de 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < v ? 'star star--on' : 'star'}>
            ★
          </span>
        ))}
      </span>
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewFormError('Inicia sesión para dejar una reseña.');
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewSuccess('');
      setReviewFormError('');

      const payload = {
        rating: Number(reviewRating),
        comment: String(reviewComment || '').trim()
      };

      if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
        setReviewFormError('Selecciona una calificación entre 1 y 5.');
        return;
      }
      if (payload.comment.length < 3) {
        setReviewFormError('Escribe un comentario (mínimo 3 caracteres).');
        return;
      }

      if (myReview) {
        await reviewService.update(myReview.id, payload);
        setReviewSuccess('Reseña actualizada.');
      } else {
        await reviewService.createForProduct(product?.id || slug, payload);
        setReviewSuccess('Reseña publicada.');
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error guardando reseña:', err);
      setReviewFormError(err?.response?.data?.message || 'No se pudo guardar la reseña');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!myReview) return;
    const ok = window.confirm('¿Eliminar tu reseña?');
    if (!ok) return;
    try {
      setReviewSubmitting(true);
      setReviewSuccess('');
      setReviewFormError('');
      await reviewService.delete(myReview.id);
      setReviewSuccess('Reseña eliminada.');
      setReviewRating(5);
      setReviewComment('');
      await fetchReviews();
    } catch (err) {
      console.error('Error eliminando reseña:', err);
      setReviewFormError(err?.response?.data?.message || 'No se pudo eliminar la reseña');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Cargando producto...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Producto no encontrado</div>;

  const availableStock = hasColorVariants
    ? Number(selectedColor?.stock ?? 0)
    : Number(product.stock ?? 0);
  const isOutOfStock = Number(availableStock) <= 0;

  // Construir array de URLs absolutas de imágenes públicas
  const baseUrl = window.location.origin;
  let productImages = [];
  if (hasColorVariants && selectedColor && Array.isArray(selectedColor.images) && selectedColor.images.length > 0) {
    productImages = selectedColor.images.map(img => img.startsWith('http') ? img : `${baseUrl}/images/${img.replace(/^.*[\\\/]/, '')}`);
  } else if (Array.isArray(product.attributes?.images) && product.attributes.images.length > 0) {
    productImages = product.attributes.images.map(img => img.startsWith('http') ? img : `${baseUrl}/images/${img.replace(/^.*[\\\/]/, '')}`);
  } else if (product.image || product.attributes?.image) {
    const img = product.image || product.attributes?.image;
    productImages = [img.startsWith('http') ? img : `${baseUrl}/images/${img.replace(/^.*[\\\/]/, '')}`];
  } else if (currentImage) {
    productImages = [currentImage.startsWith('http') ? currentImage : `${baseUrl}/images/${currentImage.replace(/^.*[\\\/]/, '')}`];
  }

  // Calcular fecha de validez del precio (1 mes por defecto)
  const priceValidUntil = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  // Política de devoluciones ejemplo (ajusta según tu negocio)
  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'CO',
    'returnPolicyCategory': 'https://schema.org/RefundPolicy',
    'returnPolicySeasonalOverride': 'No',
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/FreeReturn',
    'returnWindow': '30 días'
  };

  // Detalles de envío ejemplo (ajusta según tu negocio)
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': '0',
      'currency': 'COP'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'CO'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 1,
        'maxValue': 2,
        'unitCode': 'd'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 2,
        'maxValue': 5,
        'unitCode': 'd'
      }
    }
  };

  // Reseñas y ratings
  const aggregateRating = (reviewsSummary && reviewsSummary.count > 0) ? {
    '@type': 'AggregateRating',
    'ratingValue': reviewsSummary.average,
    'reviewCount': reviewsSummary.count
  } : undefined;

  const reviewList = (reviews && reviews.length > 0)
    ? reviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        'author': r.userName || 'Usuario',
        'datePublished': r.createdAt ? r.createdAt.split('T')[0] : undefined,
        'reviewBody': r.comment,
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': r.rating,
          'bestRating': 5,
          'worstRating': 1
        }
      }))
    : undefined;

  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || product.name,
    description: product.description,
    image: productImages,
    brand: {
      '@type': 'Brand',
      name: 'Karell Premium'
    },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'COP',
      price: Number(product.price).toFixed(2),
      availability: availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil,
      hasMerchantReturnPolicy: merchantReturnPolicy,
      shippingDetails: shippingDetails
    },
    ...(aggregateRating && { aggregateRating }),
    ...(reviewList && { review: reviewList })
  };

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
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title || product.name,
        item: window.location.href
      }
    ]
  };

  return (
    <div className="product-detail">
      <SEO
        title={product.title || product.name}
        description={`${product.description || product.title} - Precio: $${product.price.toLocaleString('es-CO')} COP. Disponible en Karell Premium con envío a toda Colombia.`}
      />
      <StructuredData type="product" data={productData} />
      <StructuredData type="breadcrumb-product" data={breadcrumbData} />
      <div className="container">
        <button onClick={() => navigate('/products')} className="btn-back">
          ← Volver a productos
        </button>
        <div className="product-detail-content">
          <div className="product-image-large">
            <OptimizedImage
              src={currentImage || product.image || product.attributes?.image || 'https://via.placeholder.com/500'}
              alt={product.title || product.name}
              width="500"
              height="500"
              objectFit="contain"
              loading="eager"
            />
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
                      className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setCurrentImage(images[idx]);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="product-info-detail">
            <h1>{product.title || product.name}</h1>
            <p className="product-category">{product.category}</p>

            {hasColorVariants && (
              <div className="color-selector-detail">
                <h3>Selecciona un color:</h3>
                <div className="color-options-detail">
                  {colorVariants.map((variant, idx) => (
                    <button
                      key={idx}
                      className={`color-option-detail ${selectedColor?.name === variant.name ? 'active' : ''} ${(Number(variant.stock) || 0) <= 0 ? 'out-of-stock' : ''}`}
                      onClick={() => handleColorChange(variant)}
                      title={`Stock disponible: ${variant.stock || 0}`}
                    >
                      <div className="color-circle" style={{ backgroundColor: variant.hex }}>
                        {selectedColor?.name === variant.name && <span className="check-mark">✓</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="color-name">{variant.name}</span>
                        <span className={`color-stock ${(Number(variant.stock) || 0) <= 0 ? 'out-of-stock' : ''}`}>
                          Stock: {variant.stock || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-price-detail">
              {!isOutOfStock ? (
                <>
                  <span className="price">${Number(product.price).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                  {product.originalPrice && (
                    <span className="original-price">${Number(product.originalPrice).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                  )}
                </>
              ) : (
                <div className="product-unavailable-box" role="status">
                  <div className="product-unavailable-title">Producto no disponible</div>
                  <div className="product-unavailable-desc">
                    Déjanos tu nombre y tu WhatsApp y te contactamos cuando vuelva a estar disponible.
                  </div>
                </div>
              )}
            </div>

            <div className="product-description-detail">
              {renderDescription(product.description)}
            </div>

            <div className={`product-stock ${Number(availableStock) <= 0 ? 'out-of-stock' : ''}`}>
              Stock: <strong>{availableStock}</strong>
            </div>

            {!isOutOfStock ? (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedColor ? (selectedColor.stock || product.stock) : product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedColor ? (selectedColor.stock || product.stock) : product.stock, quantity + 1))}
                    disabled={quantity >= (selectedColor ? (selectedColor.stock || product.stock) : product.stock)}
                  >
                    +
                  </button>
                </div>
                <button onClick={handleAddToCart} className="btn btn-primary btn-lg">
                  Agregar al carrito
                </button>
              </div>
            ) : (
              <div className="product-interest-form-wrap">
                <form className="product-interest-form" onSubmit={handleSubmitInterest}>
                  <div className="product-interest-row">
                    <label>
                      Nombre
                      <input
                        type="text"
                        value={interestName}
                        onChange={(e) => setInterestName(e.target.value)}
                        required
                        maxLength={120}
                        placeholder="Tu nombre"
                      />
                    </label>
                    <label>
                      WhatsApp
                      <input
                        type="tel"
                        value={interestWhatsapp}
                        onChange={(e) => setInterestWhatsapp(e.target.value)}
                        required
                        maxLength={30}
                        placeholder="Ej: +57 300 123 4567"
                      />
                    </label>
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={interestSubmitting}>
                    {interestSubmitting ? 'Enviando...' : 'Quiero que me contacten'}
                  </button>
                  {interestSuccess && <div className="product-interest-success">{interestSuccess}</div>}
                  {interestError && <div className="product-interest-error">{interestError}</div>}
                </form>
              </div>
            )}

            {product.features && (
              <div className="product-features">
                <h3>Características</h3>
                <ul>
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="product-reviews">
              <div className="product-reviews__header">
                <h3>Reseñas</h3>
                <div className="product-reviews__summary">
                  {renderStars(Math.round(reviewsSummary.average || 0))}
                  <span className="product-reviews__summary-text">
                    {Number(reviewsSummary.average || 0).toFixed(1)}/5 ({reviewsSummary.count || 0})
                  </span>
                </div>
              </div>

              {reviewsLoading && <div className="product-reviews__hint">Cargando reseñas...</div>}
              {reviewsError && <div className="product-reviews__error">{reviewsError}</div>}

              {!reviewsLoading && !reviewsError && (
                <div className="review-list">
                  {reviews.length === 0 ? (
                    <div className="review-empty">Aún no hay reseñas. Sé el primero en comentar.</div>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className={`review-item ${myReview?.id === r.id ? 'review-item--mine' : ''}`}>
                        <div className="review-item__top">
                          <div className="review-item__author">
                            {r.user?.avatar ? (
                              <img
                                className="review-item__avatar"
                                src={getStaticUrl(r.user.avatar)}
                                alt={(r.user?.name || 'Usuario') + ' avatar'}
                                loading="lazy"
                              />
                            ) : (
                              <div className="review-item__avatar review-item__avatar--placeholder" aria-hidden="true" />
                            )}
                            <span className="review-item__name">
                              {(r.user?.name || 'Usuario') + (r.user?.lastName ? ' ' + r.user.lastName : '')}
                            </span>
                            <span className="review-item__date">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-CO') : ''}
                            </span>
                            {r.verifiedPurchase && <span className="review-item__verified">Compra verificada</span>}
                            {myReview?.id === r.id && <span className="review-item__badge">Tu reseña</span>}
                          </div>
                          <div className="review-item__rating">{renderStars(r.rating)}</div>
                        </div>
                        <div className="review-item__comment">{r.comment}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="review-form-wrap">
                <h4 className="review-form-title">{myReview ? 'Editar tu reseña' : 'Escribe una reseña'}</h4>

                {!isAuthenticated ? (
                  <div className="review-login-hint">Inicia sesión para dejar una reseña.</div>
                ) : (
                  <form className="review-form" onSubmit={handleSubmitReview}>
                    <label className="review-field">
                      Calificación
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        disabled={reviewSubmitting}
                      >
                        <option value={5}>5 - Excelente</option>
                        <option value={4}>4 - Muy bueno</option>
                        <option value={3}>3 - Bueno</option>
                        <option value={2}>2 - Regular</option>
                        <option value={1}>1 - Malo</option>
                      </select>
                    </label>

                    <label className="review-field">
                      Comentario
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Cuéntanos tu experiencia con este producto"
                        maxLength={2000}
                        rows={4}
                        disabled={reviewSubmitting}
                      />
                    </label>

                    <div className="review-actions">
                      <button className="btn btn-primary" type="submit" disabled={reviewSubmitting}>
                        {reviewSubmitting ? 'Guardando...' : (myReview ? 'Guardar cambios' : 'Publicar reseña')}
                      </button>
                      {myReview && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={handleDeleteMyReview}
                          disabled={reviewSubmitting}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    {reviewSuccess && <div className="review-success">{reviewSuccess}</div>}
                    {reviewFormError && <div className="review-error">{reviewFormError}</div>}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ProductDetail;
