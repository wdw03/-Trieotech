import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Heart,
  Mail,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Send
} from 'lucide-react';
import TrioLogo from '../common/TrioLogo';
import { useToast } from '../../context/ToastContext';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { addToast } = useToast();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      addToast('Thank you for joining our Artisan Guild newsletter!', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#140D08] text-stone-300 border-t border-gold-500/30 pt-12 pb-24 lg:pb-12 mt-16 font-sans">
      {/* Top Trust Features Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 border-b border-gold-500/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C120B] border border-gold-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-400 shrink-0 shadow-maroon-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">100% Handcrafted</h4>
              <p className="text-[11px] text-stone-400">Directly from Indian Karigars</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C120B] border border-gold-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-400 shrink-0 shadow-maroon-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">Free Express Shipping</h4>
              <p className="text-[11px] text-stone-400">On all orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C120B] border border-gold-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-400 shrink-0 shadow-maroon-sm">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">7-Day Replacement</h4>
              <p className="text-[11px] text-stone-400">Easy &amp; hassle-free returns</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C120B] border border-gold-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center text-gold-400 shrink-0 shadow-maroon-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">100% Secure Checkout</h4>
              <p className="text-[11px] text-stone-400">UPI, Cards, NetBanking &amp; COD</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <TrioLogo />
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Trio Ecart celebrates India's rich artisanal heritage. We bring you hand-embroidered Zardosi patches, sacred pooja essentials, Ayurvedic copper drinkware, and festive wedding embellishments crafted with generational mastery.
            </p>
            
            <div className="space-y-2 text-xs text-stone-300 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Jaipur Handicraft Cluster &amp; Surat Textile Hub, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Patron Support: +91 98765 43210 (Mon-Sat, 10 AM - 7 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <span>care@trioecart.com</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-2">
              <span className="text-xs font-bold text-gold-300 uppercase tracking-wider block mb-2">
                Subscribe for Exclusive Festive Drops
              </span>
              <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[#1E140D] rounded-xl border border-gold-500/30 text-xs text-stone-200 placeholder:text-stone-500 outline-none focus:border-gold-400"
                />
                <button
                  type="submit"
                  className="btn-gold px-4 py-2.5 text-xs uppercase tracking-wider font-bold rounded-xl"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-gold-400 uppercase tracking-wider">
              Craft Categories
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/category/patches" className="hover:text-gold-300 transition-colors">Embroidery Patches</Link></li>
              <li><Link to="/category/bottle" className="hover:text-gold-300 transition-colors">Pure Copper Bottles</Link></li>
              <li><Link to="/category/aasan" className="hover:text-gold-300 transition-colors">Pooja Aasans &amp; Thali</Link></li>
              <li><Link to="/category/towel-gamcha" className="hover:text-gold-300 transition-colors">Pure Cotton Gamcha</Link></li>
              <li><Link to="/category/flower-bunch" className="hover:text-gold-300 transition-colors">Artificial Flower Bunches</Link></li>
              <li><Link to="/category/cup-chain" className="hover:text-gold-300 transition-colors">Stone &amp; Cup Chains</Link></li>
              <li><Link to="/category/paranda" className="hover:text-gold-300 transition-colors">Bridal Paranda Latkans</Link></li>
              <li><Link to="/category/chudi-ring" className="hover:text-gold-300 transition-colors">Gota Chudi Rings</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-gold-400 uppercase tracking-wider">
              Patron Care
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/track-order" className="hover:text-gold-300 transition-colors">Track Your Order</Link></li>
              <li><Link to="/profile/orders" className="hover:text-gold-300 transition-colors">Order History &amp; Invoice</Link></li>
              <li><Link to="/shipping" className="hover:text-gold-300 transition-colors">Shipping &amp; Delivery</Link></li>
              <li><Link to="/returns" className="hover:text-gold-300 transition-colors">Return &amp; Exchange Policy</Link></li>
              <li><Link to="/faq" className="hover:text-gold-300 transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/contact" className="hover:text-gold-300 transition-colors">Contact Artisan Guild</Link></li>
            </ul>
          </div>

          {/* About & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-gold-400 uppercase tracking-wider">
              Artisan Guild
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/about" className="hover:text-gold-300 transition-colors">Our Karigar Story</Link></li>
              <li><Link to="/blog" className="hover:text-gold-300 transition-colors">Craft Journal &amp; Guides</Link></li>
              <li><Link to="/privacy" className="hover:text-gold-300 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-gold-300 transition-colors">Terms of Service</Link></li>
            </ul>

            {/* Social Icons */}
            <div className="pt-3">
              <span className="text-[11px] font-bold text-gold-300 uppercase tracking-wider block mb-2">
                Follow Our Karigars
              </span>
              <div className="flex items-center gap-2">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <p>© {new Date().getFullYear()} Trio Ecart. Handcrafted with devotion in India. All Rights Reserved.</p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400">
          <span className="px-2 py-0.5 rounded bg-[#1E140D] border border-gold-500/20">UPI</span>
          <span className="px-2 py-0.5 rounded bg-[#1E140D] border border-gold-500/20">RuPay</span>
          <span className="px-2 py-0.5 rounded bg-[#1E140D] border border-gold-500/20">Visa</span>
          <span className="px-2 py-0.5 rounded bg-[#1E140D] border border-gold-500/20">Mastercard</span>
          <span className="px-2 py-0.5 rounded bg-[#1E140D] border border-gold-500/20">Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
