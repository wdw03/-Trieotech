import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import CartDrawer from './components/cart/CartDrawer';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <HelmetProvider>
      <Router>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <WishlistProvider>
                <CartProvider>
                  <Layout>
                    <AppRoutes />
                  </Layout>
                  <CartDrawer />
                </CartProvider>
              </WishlistProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
