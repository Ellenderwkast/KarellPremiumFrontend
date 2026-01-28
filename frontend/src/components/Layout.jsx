import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingCart from './FloatingCart';
import '../styles/layout.css';
import WhatsAppButton from './WhatsAppButton';

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

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
