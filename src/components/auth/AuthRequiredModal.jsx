'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AuthRequiredModal() {
  const { isAuthModalOpen, closeAuthModal, pendingProduct } = useCart();
  const { login, register, sendSignupOtp } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isAuthModalOpen) return null;

  const product = pendingProduct?.product || pendingProduct;
  const productPrice = product?.price || pendingProduct?.price;
  const productImage = Array.isArray(product?.images) && product.images.length > 0 
    ? product.images[0] 
    : (typeof product?.images === 'string' ? product.images : product?.image || '/logo.png');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setError(res.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('Login error: ' + (err.message || 'Something went wrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendSignupOtp(regEmail, regName);

      if (!res.success) {
        setError(res.error || 'Registration failed. Please check details.');
      } else {
        const payload = {
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          verificationToken: res.verificationToken,
          expiresAt: res.expiresAt,
        };

        try {
          sessionStorage.setItem('trio_pending_signup', JSON.stringify(payload));
          localStorage.setItem('trio_pending_signup', JSON.stringify(payload));
        } catch (_) {}

        closeAuthModal();
        const currentPath = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/';
        window.location.href = `/verify-otp?email=${encodeURIComponent(regEmail)}&redirect=${encodeURIComponent(currentPath)}`;
      }
    } catch (err) {
      setError('Registration error: ' + (err.message || 'Something went wrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Backdrop Dismiss */}
      <div className="fixed inset-0" onClick={closeAuthModal} />

      {/* Modal / Bottom Sheet Box */}
      <div 
        className="relative z-10 w-full sm:max-w-md bg-ivory-50 dark:bg-[#1A110B] border-t sm:border border-gold-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-gold-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-maroon-100 dark:bg-maroon-900/40 border border-gold-500/30 flex items-center justify-center text-maroon-700 dark:text-gold-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-black text-base sm:text-lg text-stone-900 dark:text-ivory-100 leading-tight">
                Sign In to Add to Bag
              </h2>
              <p className="text-[11px] text-stone-500">
                Pehle Login ya Register karein
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Product Preview Card */}
          {product && (
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900/60 border border-gold-500/20 flex items-center gap-3 shadow-xs">
              <img 
                src={productImage} 
                alt={product.name || 'Artisan Product'}
                className="w-14 h-14 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shrink-0"
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider block">
                  Waiting to be added
                </span>
                <h4 className="text-xs font-bold text-stone-900 dark:text-ivory-100 truncate">
                  {product.name}
                </h4>
                <p className="text-xs font-serif font-black text-maroon-700 dark:text-gold-400 mt-0.5">
                  ₹{Number(productPrice || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-stone-200/70 dark:bg-stone-900 rounded-xl border border-gold-500/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-[#251A12] text-maroon-700 dark:text-gold-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-[#251A12] text-maroon-700 dark:text-gold-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              New Customer
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="patron@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 dark:text-stone-300 block">
                    Password
                  </label>
                  <Link 
                    href="/forgot-password" 
                    onClick={closeAuthModal}
                    className="text-[11px] text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In &amp; Add to Bag</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Radhika Singhania"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="patron@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bonus Tag */}
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>🎁 Auto 15% discount code FIRSTBUY on your first order!</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Add to Bag</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Assurances */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Secure Checkout
            </span>
            <Link
              href="/login"
              onClick={closeAuthModal}
              className="text-gold-600 dark:text-gold-400 hover:underline font-semibold"
            >
              Open Full Login Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
