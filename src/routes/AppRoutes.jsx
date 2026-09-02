import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import HomePage from '../pages/Home/HomePage';
import ShopPage from '../pages/Shop/ShopPage';
import CategoryPage from '../pages/Category/CategoryPage';
import ProductPage from '../pages/Product/ProductPage';
import SearchPage from '../pages/Search/SearchPage';
import CartPage from '../pages/Cart/CartPage';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import OrderSuccessPage from '../pages/Checkout/OrderSuccessPage';
import OrderTrackingPage from '../pages/Orders/OrderTrackingPage';
import WishlistPage from '../pages/Wishlist/WishlistPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import MyOrdersPage from '../pages/Profile/MyOrdersPage';
import BlogListPage from '../pages/Blog/BlogListPage';
import BlogDetailPage from '../pages/Blog/BlogDetailPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import AboutPage from '../pages/Static/AboutPage';
import ContactPage from '../pages/Static/ContactPage';
import FAQPage from '../pages/Static/FAQPage';
import ShippingPage from '../pages/Static/ShippingPage';
import ReturnsPage from '../pages/Static/ReturnsPage';
import PrivacyPage from '../pages/Static/PrivacyPage';
import TermsPage from '../pages/Static/TermsPage';
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Home & Catalog */}
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:slug" element={<ProductPage />} />
      <Route path="/search" element={<SearchPage />} />

      {/* Cart & Checkout Flow */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
      <Route path="/track-order" element={<OrderTrackingPage />} />
      <Route path="/track/:orderId" element={<OrderTrackingPage />} />

      {/* Wishlist & Patron Account */}
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/account" element={<Navigate to="/profile" replace />} />
      <Route path="/profile/orders" element={<MyOrdersPage />} />
      <Route path="/account/orders" element={<Navigate to="/profile/orders" replace />} />

      {/* Blog & Craft Journal */}
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogDetailPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Static Info Pages */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/shipping" element={<ShippingPage />} />
      <Route path="/returns" element={<ReturnsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
