import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './lib/auth';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  // Paste inside App.tsx or root layout component
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sc-web-traffic-production.up.railway.app/scribe-count.tracker.js';
    script.defer = true;
    script.onload = () => {
      (window as any).tracker?.init('sc_live_ygKZLZubkWAEv8ujI6dD2vu3tpoCV36U', { endpoint: 'https://sc-web-traffic-production.up.railway.app/api/collect' });
    };
    document.head.appendChild(script);
  }, []);


  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col bg-slate-50">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/order/:id" element={<OrderDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
