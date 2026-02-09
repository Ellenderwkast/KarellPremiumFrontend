import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, ShoppingCart, User, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import SearchBar from './SearchBar';
import OptimizedImage from './OptimizedImage';
import '../styles/header.css';

function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const cartCount = useCartStore(state => state.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const annRef = useRef(null);
  const textRef = useRef(null);
  const [isMarquee, setIsMarquee] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
    setUserMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => setUserMenuOpen(prev => !prev);

  useEffect(() => {
    if (!userMenuOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    const onPointerDown = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [userMenuOpen]);

  // Marquee-on-overflow: enable scrolling animation only when text overflows
  useEffect(() => {
    const container = annRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    let rafId = null;
    const update = () => {
      if (!container || !textEl) return;

      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        container.classList.remove('is-scrolling');
        setIsMarquee(false);
        return;
      }

      // Use the immediate text wrapper width (avoids container padding issues)
      const textWrapper = textEl.parentElement || container;
      const cW = textWrapper.clientWidth;
      const tW = textEl.scrollWidth;
      if (tW > cW + 6) {
        const distance = tW - cW;
        const pxPerSec = 60;
        const duration = Math.max(6, Math.round((tW / pxPerSec) * 10) / 10);
        textEl.style.setProperty('--marquee-translate', `-${distance}px`);
        textEl.style.setProperty('--marquee-duration', `${duration}s`);
        container.classList.add('is-scrolling');
        setIsMarquee(true);
      } else {
        textEl.style.removeProperty('--marquee-translate');
        textEl.style.removeProperty('--marquee-duration');
        container.classList.remove('is-scrolling');
        setIsMarquee(false);
      }
    };

    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    // run once and whenever the route changes so marquee re-evaluates on SPA navigation
    update();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  return (
    <header className="header">
      <div className="announcement-bar" role="region" aria-label="Anuncio principal" ref={annRef}>
        {typeof window !== 'undefined' && (() => {
          const text = 'Audífonos Bluetooth, Relojes Inteligentes y Accesorios Tecnológicos | Karell Premium';
          return (
            <p className="announcement-text" role="heading" aria-level="2">
              <span className="announcement-inner" ref={textRef}>{text}</span>
            </p>
          );
        })()}
      </div>
      <div className="header-container">
        <div className={`header-content ${menuOpen ? 'is-open' : ''}`}>
          <Link to="/" className="logo" aria-label="Karell Premium inicio">
            <span className="logo-mark" aria-hidden="true">
              <OptimizedImage 
                className="logo-image" 
                src="/images/logo.webp" 
                alt="Tienda Logo"
                width="200"
                height="50"
                objectFit="contain"
              />
            </span>
          </Link>

          <div className="header-search-mobile">
            <SearchBar />
            <Link
              to="/cart"
              className="cart-link cart-link-inline"
              onClick={closeMenu}
              aria-label={cartCount > 0 ? `Ver carrito (${cartCount} productos)` : 'Ver carrito'}
            >
              <span className="cart-icon">
                <ShoppingCart aria-hidden="true" />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </span>
            </Link>
          </div>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`header-collapse ${menuOpen ? 'open' : ''}`}>
            <button 
              className="menu-close"
              type="button"
              aria-label="Cerrar menú"
              onClick={closeMenu}
            >
              <X aria-hidden="true" />
            </button>

            <div className="search-desktop-only">
              <SearchBar />
            </div>

            <nav className="nav" data-open={menuOpen}>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Inicio
              </Link>
              <Link to="/products" className="nav-link" onClick={closeMenu}>
                Productos
              </Link>
              <Link to="/blog" className="nav-link" onClick={closeMenu}>
                Blog
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/orders" className="nav-link" onClick={closeMenu}>
                    Mis Pedidos
                  </Link>
                </>
              )}
            </nav>

            <div className="header-actions" data-open={menuOpen}>
              <a
                className="btn btn-whatsapp-outline"
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '573158164656'}`}
                target="_blank"
                rel="noreferrer"
                onClick={closeMenu}
                title="Contactar por WhatsApp"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <path d="M16 0C7.164 0 0 7.164 0 16c0 2.832.744 5.488 2.048 7.792L0 32l8.416-2.048C10.72 31.256 13.376 32 16 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.344c-2.528 0-4.928-.672-6.976-1.856l-.48-.288-5.088 1.248 1.28-4.96-.32-.512C2.88 21.024 2.144 18.56 2.144 16c0-7.648 6.208-13.856 13.856-13.856S29.856 8.352 29.856 16 23.648 29.344 16 29.344zm7.52-10.24c-.416-.208-2.432-1.2-2.816-1.344-.384-.128-.656-.192-.928.208-.288.384-1.088 1.344-1.328 1.632-.24.272-.496.304-.912.096-.416-.208-1.76-.64-3.344-2.048-1.232-1.088-2.064-2.432-2.304-2.848-.24-.416-.016-.64.176-.848.192-.192.416-.496.624-.752.208-.24.272-.416.416-.688.128-.288.064-.528-.032-.736-.096-.208-.928-2.24-1.28-3.072-.336-.8-.672-.688-.928-.704h-.784c-.272 0-.72.096-1.088.496-.384.416-1.456 1.424-1.456 3.456s1.488 4.016 1.696 4.288c.208.288 2.928 4.48 7.104 6.272.992.432 1.76.688 2.368.864.992.32 1.904.272 2.624.16.8-.128 2.432-.992 2.784-1.952.336-.96.336-1.792.24-1.952-.112-.176-.4-.288-.816-.496z" />
                </svg>
              </a>

              <Link to="/cart" className="cart-link" onClick={closeMenu}>
                <span className="cart-icon">
                  <ShoppingCart aria-hidden="true" />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </span>
                <span className="cart-label">Carrito</span>
              </Link>

              {isAuthenticated ? (
                <div className="user-dropdown" ref={userMenuRef}>
                  <button
                    type="button"
                    className="user-trigger"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    onClick={toggleUserMenu}
                  >
                    <span className="user-trigger-text">{user?.name || 'Mi cuenta'}</span>
                    <ChevronDown className={`user-trigger-icon ${userMenuOpen ? 'open' : ''}`} aria-hidden="true" />
                  </button>

                  <div className={`user-dropdown-menu ${userMenuOpen ? 'open' : ''}`} role="menu">
                    <Link to="/profile" className="user-dropdown-item" role="menuitem" onClick={closeMenu}>
                      <User className="user-dropdown-icon" aria-hidden="true" /> Mi cuenta
                    </Link>
                    {user?.isAdmin && (
                      <Link to="/admin" className="user-dropdown-item" role="menuitem" onClick={closeMenu}>
                        <Settings className="user-dropdown-icon" aria-hidden="true" /> Panel Admin
                      </Link>
                    )}
                    <button type="button" className="user-dropdown-item danger" role="menuitem" onClick={handleLogout}>
                      <LogOut className="user-dropdown-icon" aria-hidden="true" /> Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="btn btn-primary" onClick={closeMenu}>
                    Iniciar sesión
                  </Link>
                  <Link to="/register" className="btn btn-outline" onClick={closeMenu}>
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Fila 2: navegación secundaria */}
        <nav className="header-subnav">
          <Link to="/categories" className="subnav-link">Categorías</Link>
          <Link to="/offers" className="subnav-link">Ofertas <span role="img" aria-label="Ofertas">🔥</span></Link>
          <Link to="/new" className="subnav-link">Nuevos productos</Link>
          <Link to="/blog" className="subnav-link">Blog</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
