import React, { Suspense, lazy } from 'react';
import CotizarCoordinadoraDemo from './pages/CotizarCoordinadoraDemo';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy para páginas legales también
const PrivacyPolicy = lazy(() => import(/* webpackChunkName: "privacy" */ './pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import(/* webpackChunkName: "terms" */ './pages/TermsOfService'));

// Lazy-load pages to reduce initial bundle
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const CreateAccountFromOrder = lazy(() => import('./pages/CreateAccountFromOrder'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
// const AdminRoutes = lazy(() => import('./pages/AdminRoutes.jsx'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'));
const BlogList = lazy(() => import('./pages/blog/BlogList'));
const BlogPost = lazy(() => import('./pages/blog/BlogPost'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/payment-return" element={<PaymentReturn />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/create-account" element={<CreateAccountFromOrder />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cotizar-demo" element={<CotizarCoordinadoraDemo />} />
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
