import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import OptimizedImage from '../components/OptimizedImage';
import '../styles/cart.css';
import SEO from '../components/SEO';

function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <SEO
          title="Tu carrito está vacío"
          description="Tu carrito de compras en Karell Premium está vacío. Explora nuestro catálogo de productos y añade tus audífonos y accesorios favoritos."
          robots="noindex, follow"
        />
        <div className="container">
          <h2>Tu carrito está vacío</h2>
          <p>Explora nuestros productos y añade algunos a tu carrito</p>
          <Link to="/products" className="btn btn-primary">
            Ir a productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <SEO
        title="Tu carrito de compras"
        description="Revisa y edita los productos de tu carrito antes de finalizar la compra en Karell Premium."
        robots="noindex, follow"
      />
      <div className="container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Volver
          </button>
          <h1>Tu carrito</h1>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {items.map(item => (
              <div key={item.key} className="cart-item">
                <OptimizedImage 
                  src={item.image || 'https://via.placeholder.com/100'} 
                  alt={item.title}
                  className="cart-item-image"
                  width="100"
                  height="100"
                  objectFit="cover"
                />
                <div className="item-info">
                  <h3>{item.title}</h3>
                  {item.color && (
                    <p className="item-color">
                      Color:
                      <span className="color-indicator">
                        <span className="color-dot" style={{ backgroundColor: item.colorHex || '#ccc' }}></span>
                        <strong>{item.color}</strong>
                      </span>
                    </p>
                  )}
                  <p className="item-price">${Number(item.price).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="item-quantity">
                  <button
                    onClick={() => updateQuantity(item.key, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateQuantity(item.key, parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                </div>
                <div className="item-total">${(item.price * item.quantity).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</div>
                <button onClick={() => removeItem(item.key)} className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Resumen del pedido</h2>
            <div className="summary-items">
              {items.map(item => (
                <div key={item.key} className="summary-item">
                  <div className="summary-item-info">
                    <span className="summary-item-name">
                      {item.title}
                      {item.color && (
                        <span className="summary-color-badge">
                          <span
                            className="color-dot"
                            style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: item.colorHex || '#ccc',
                              marginLeft: '6px',
                              marginRight: '4px',
                              verticalAlign: 'middle',
                              border: '1px solid #ddd'
                            }}
                          ></span>
                          {item.color}
                        </span>
                      )}
                    </span>
                    <span className="summary-item-qty">x{item.quantity}</span>
                  </div>
                  <span className="summary-item-price">${(item.price * item.quantity).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
            </div>

            <Link to="/checkout" className="btn btn-primary btn-block">
              Proceder al pago
            </Link>
            <button onClick={clearCart} className="btn btn-outline btn-block mt-2">
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
