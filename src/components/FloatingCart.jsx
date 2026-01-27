import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import '../styles/floatingCart.css';

function FloatingCart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Estado para detectar si el header mobile menu está abierto (detectado por clase)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', updateMobile);
    updateMobile();
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    const headerEl = document.querySelector('.header-content');
    if (!headerEl) return undefined;
    // Inicial
    setHeaderMenuOpen(headerEl.classList.contains('is-open'));
    const mo = new MutationObserver((mutationsList) => {
      for (const m of mutationsList) {
        if (m.attributeName === 'class') {
          setHeaderMenuOpen(headerEl.classList.contains('is-open'));
        }
      }
    });
    mo.observe(headerEl, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  // No mostrar en la página del carrito, checkout, admin o si el header mobile menu está abierto en móvil
  if (
    totalItems === 0 ||
    location.pathname === '/cart' ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/admin') ||
    (isMobile && headerMenuOpen)
  ) return null;

  return (
    <div className="floating-cart" onClick={() => navigate('/cart')}>
      <div className="floating-cart-icon">
        <ShoppingCart aria-hidden="true" />
        <span className="floating-cart-badge">{totalItems}</span>
      </div>
      <div className="floating-cart-content">
        <div className="floating-cart-text">
          <span className="floating-cart-items">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</span>
          <span className="floating-cart-total">${total.toLocaleString('es-CO')}</span>
        </div>
        <div className="floating-cart-arrow"><ChevronRight aria-hidden="true" /></div>
      </div>
    </div>
  );
}

export default FloatingCart;
