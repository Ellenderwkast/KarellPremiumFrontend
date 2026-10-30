import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import FloatingCart from './FloatingCart';
import '../styles/layout.css';
import WhatsAppButton from './WhatsAppButton';

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);

    const restoreScrollBehavior = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(restoreScrollBehavior);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [location.pathname]);

  return (
    <div className="layout">
      <Header />
      <main className={`main-content ${isAdminRoute ? 'main-content--admin' : ''}`.trim()}>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
      <FloatingCart />
    </div>
  );
}

export default Layout;
