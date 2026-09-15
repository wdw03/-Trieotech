'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Truck,
  RotateCcw,
  ShieldCheck,
  Send,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ArrowUp,
  MessageCircle,
  PackageSearch,
  Sparkles,
  Heart,
  CheckCircle2
} from 'lucide-react';
import TrioLogo from '../common/TrioLogo';
import { useToast } from '../../context/ToastContext';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [openSections, setOpenSections] = useState({
    categories: false,
    care: false,
    about: false,
  });
  const { addToast } = useToast();

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      addToast('Thank you for joining our Artisan Guild newsletter! ✨', 'success');
      setNewsletterEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-b from-[#180E09] via-[#120A06] to-[#0A0503] text-stone-300 border-t border-gold-500/25 mt-16 font-inter w-full max-w-full overflow-hidden pb-32 sm:pb-20 lg:pb-12">
      
      {/* Back to Top Bar */}
      <button
        onClick={scrollToTop}
        className="w-full py-3 bg-[#1F130B]/80 hover:bg-[#2A1A0F] border-b border-gold-500/15 text-gold-400/90 hover:text-gold-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 group cursor-pointer"
        aria-label="Back to top of page"
      >
        <span>Back to Top</span>
        <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Top Trust Features Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 border-b border-gold-500/15">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          
          <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#1C120B]/90 border border-gold-500/20 backdrop-blur-sm shadow-sm hover:border-gold-500/40 transition-colors">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-300 shrink-0 shadow-maroon-sm">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-gold-200 truncate">100% Handcrafted</h4>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">Jaipur &amp; Surat Karigars</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#1C120B]/90 border border-gold-500/20 backdrop-blur-sm shadow-sm hover:border-gold-500/40 transition-colors">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-300 shrink-0 shadow-maroon-sm">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-gold-200 truncate">Free Express Ship</h4>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">Orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#1C120B]/90 border border-gold-500/20 backdrop-blur-sm shadow-sm hover:border-gold-500/40 transition-colors">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-300 shrink-0 shadow-maroon-sm">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-gold-200 truncate">7-Day Easy Return</h4>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">Hassle-free guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#1C120B]/90 border border-gold-500/20 backdrop-blur-sm shadow-sm hover:border-gold-500/40 transition-colors">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-300 shrink-0 shadow-maroon-sm">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-gold-200 truncate">100% Secure Checkout</h4>
              <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">UPI, Cards &amp; COD</p>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Quick Action Buttons (Visible only on mobile/tablet) */}
      <div className="lg:hidden px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="https://wa.me/919876543210?text=Hi%20Trio%20Enterprises%2C%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20products."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0F2416] border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-950/60 transition-colors"
          >
            <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
            <span>WhatsApp Help</span>
          </a>

          <Link
            href="/track-order"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1F140D] border border-gold-500/30 text-gold-300 text-xs font-semibold hover:bg-[#2A1B12] transition-colors"
          >
            <PackageSearch className="w-4 h-4 text-gold-400" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <TrioLogo />
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm font-medium">
              Trio Enterprises honors timeless Indian craftsmanship — bringing you handcrafted Zardosi embroidery patches, sacred mandir essentials, pure copper Ayurvedic drinkware, and festive bridal decor created by generational artisans.
            </p>
            
            <div className="space-y-2 text-xs text-stone-300 pt-1 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span className="text-stone-400">Jaipur Handicrafts Hub &amp; Surat Textile Cluster, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-gold-300 transition-colors">+91 98765 43210 (Mon-Sat, 10 AM - 7 PM)</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="mailto:care@trioenterprises.com" className="hover:text-gold-300 transition-colors">care@trioenterprises.com</a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-2">
              <span className="text-xs font-bold text-gold-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                Join the Artisan Guild &amp; Get ₹100 Off
              </span>
              <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[#1E140D] rounded-xl border border-gold-500/30 text-xs text-stone-200 placeholder:text-stone-500 outline-none focus:border-gold-400 min-w-0 font-medium"
                />
                <button
                  type="submit"
                  className="btn-gold px-4 py-2.5 text-xs uppercase tracking-wider font-bold rounded-xl shrink-0"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-[10px] text-stone-500 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> No spam. Only festive discounts &amp; new craft launches.
              </p>
            </div>
          </div>

          {/* Desktop Columns / Mobile Accordions */}

          {/* 1. Craft Categories */}
          <div className="border-b lg:border-none border-gold-500/15 pb-4 lg:pb-0">
            {/* Mobile Accordion Header */}
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between py-2 text-left lg:pointer-events-none"
              aria-expanded={openSections.categories}
            >
              <h4 className="font-bold text-sm text-gold-300 uppercase tracking-wider flex items-center gap-2">
                <span>Craft Collections</span>
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-gold-400 transition-transform duration-200 lg:hidden ${
                  openSections.categories ? 'rotate-180' : ''
                }`}
              />
            </button>
            {/* Links List */}
            <ul
              className={`space-y-2 text-xs text-stone-400 font-medium pt-2 transition-all duration-200 ${
                openSections.categories ? 'block' : 'hidden lg:block'
              }`}
            >
              <li><Link href="/category/patches" className="hover:text-gold-300 transition-colors block py-0.5">Embroidery Patches &amp; Buttis</Link></li>
              <li><Link href="/category/bottle" className="hover:text-gold-300 transition-colors block py-0.5">Pure Copper Ayurvedic Bottles</Link></li>
              <li><Link href="/category/aasan" className="hover:text-gold-300 transition-colors block py-0.5">Pooja Aasans &amp; Thali Covers</Link></li>
              <li><Link href="/category/towel-gamcha" className="hover:text-gold-300 transition-colors block py-0.5">Pure Cotton Devotional Gamcha</Link></li>
              <li><Link href="/category/flower-bunch" className="hover:text-gold-300 transition-colors block py-0.5">Handmade Artificial Flowers</Link></li>
              <li><Link href="/category/cup-chain" className="hover:text-gold-300 transition-colors block py-0.5">Zari Stone &amp; Cup Chains</Link></li>
              <li><Link href="/category/paranda" className="hover:text-gold-300 transition-colors block py-0.5">Bridal Paranda Latkans</Link></li>
              <li><Link href="/category/chudi-ring" className="hover:text-gold-300 transition-colors block py-0.5">Traditional Gota Chudi Rings</Link></li>
            </ul>
          </div>

          {/* 2. Customer Care */}
          <div className="border-b lg:border-none border-gold-500/15 pb-4 lg:pb-0">
            {/* Mobile Accordion Header */}
            <button
              onClick={() => toggleSection('care')}
              className="w-full flex items-center justify-between py-2 text-left lg:pointer-events-none"
              aria-expanded={openSections.care}
            >
              <h4 className="font-bold text-sm text-gold-300 uppercase tracking-wider flex items-center gap-2">
                <span>Patron Support</span>
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-gold-400 transition-transform duration-200 lg:hidden ${
                  openSections.care ? 'rotate-180' : ''
                }`}
              />
            </button>
            {/* Links List */}
            <ul
              className={`space-y-2 text-xs text-stone-400 font-medium pt-2 transition-all duration-200 ${
                openSections.care ? 'block' : 'hidden lg:block'
              }`}
            >
              <li><Link href="/track-order" className="hover:text-gold-300 transition-colors block py-0.5">Track Your Order</Link></li>
              <li><Link href="/profile/orders" className="hover:text-gold-300 transition-colors block py-0.5">Order History &amp; Invoice</Link></li>
              <li><Link href="/shipping" className="hover:text-gold-300 transition-colors block py-0.5">Shipping &amp; Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-gold-300 transition-colors block py-0.5">Return &amp; Exchange Policy</Link></li>
              <li><Link href="/faq" className="hover:text-gold-300 transition-colors block py-0.5">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-gold-300 transition-colors block py-0.5">Contact Artisan Guild</Link></li>
            </ul>
          </div>

          {/* 3. Artisan Guild & Legal */}
          <div className="border-b lg:border-none border-gold-500/15 pb-4 lg:pb-0">
            {/* Mobile Accordion Header */}
            <button
              onClick={() => toggleSection('about')}
              className="w-full flex items-center justify-between py-2 text-left lg:pointer-events-none"
              aria-expanded={openSections.about}
            >
              <h4 className="font-bold text-sm text-gold-300 uppercase tracking-wider flex items-center gap-2">
                <span>Artisan Guild</span>
              </h4>
              <ChevronDown
                className={`w-4 h-4 text-gold-400 transition-transform duration-200 lg:hidden ${
                  openSections.about ? 'rotate-180' : ''
                }`}
              />
            </button>
            {/* Links List */}
            <ul
              className={`space-y-2 text-xs text-stone-400 font-medium pt-2 transition-all duration-200 ${
                openSections.about ? 'block' : 'hidden lg:block'
              }`}
            >
              <li><Link href="/about" className="hover:text-gold-300 transition-colors block py-0.5">Our Karigar Story</Link></li>
              <li><Link href="/blog" className="hover:text-gold-300 transition-colors block py-0.5">Craft Journal &amp; Guides</Link></li>
              <li><Link href="/privacy" className="hover:text-gold-300 transition-colors block py-0.5">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold-300 transition-colors block py-0.5">Terms of Service</Link></li>
            </ul>

            {/* Social Icons */}
            <div className="pt-4">
              <span className="text-[11px] font-bold text-gold-300 uppercase tracking-wider block mb-2">
                Follow Our Karigars
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#1C120B] border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/20 hover:scale-105 transition-all"
                  aria-label="WhatsApp"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#1C120B] border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#1C120B] border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright & Payment Methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-gold-500/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <p className="text-center sm:text-left text-stone-400 text-[11px] sm:text-xs">
          © {new Date().getFullYear()} <strong className="text-gold-400 font-semibold">Trio Enterprises</strong>. Handcrafted with devotion in Jaipur &amp; Surat, India. All Rights Reserved.
        </p>
        
        {/* Verified Payment Pills */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 flex-wrap justify-center">
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20 text-gold-300">UPI</span>
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20">RuPay</span>
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20">Visa</span>
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20">Mastercard</span>
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20 text-emerald-400">Cash on Delivery</span>
          <span className="px-2 py-0.5 rounded bg-[#1C120B] border border-gold-500/20 text-blue-400">Razorpay Verified</span>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
