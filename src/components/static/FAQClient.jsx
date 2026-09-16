'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import { ChevronDown, Sparkles, Search, MessageCircle, RefreshCw, X, ChevronUp, CheckCircle2 } from 'lucide-react';

const FALLBACK_FAQS = [
  {
    id: 1,
    question: "Are all Trio Enterprises embroidery patches authentic handmade zardosi?",
    answer: "Yes. Every patch in our collection is hand-stitched by skilled karigars using traditional wooden addas, genuine metallic bullion coils (zari), glass zarkans, and faux pearls. We do not sell flat machine-printed imitations.",
    category: "Craft & Authenticity"
  },
  {
    id: 2,
    question: "How do I stitch or affix embroidery appliques to lehengas, dupattas, or blouses?",
    answer: "Our applique patches feature reinforced backing that can easily be hand-stitched along the borders with a matching needle and thread, or fabric-glued using high-grade craft adhesive before fine edge stitching for permanent bridal wear.",
    category: "Usage & Care"
  },
  {
    id: 3,
    question: "Is your copper water bottle 100% pure copper?",
    answer: "Yes. Our hammered and plain matte copper bottles are crafted from 100% lab-tested, food-grade pure copper without inner chemical lacquers or lead, ensuring optimal Ayurvedic Tamra Jal health benefits.",
    category: "Craft & Authenticity"
  },
  {
    id: 4,
    question: "How long does domestic delivery take across India?",
    answer: "All orders are dispatched within 24 business hours from our Jaipur craft center. Metro cities receive deliveries in 2-3 business days, while other locations take 3-5 days via BlueDart Air Express.",
    category: "Shipping & Delivery"
  },
  {
    id: 5,
    question: "What is your return and replacement policy?",
    answer: "We offer a 7-day doorstep replacement guarantee on all items. If an item arrives transit-damaged or differs from your expectations, contact our WhatsApp support at +91 7065120322 for an instant replacement or full refund.",
    category: "Orders & Returns"
  },
  {
    id: 6,
    question: "Do you offer Cash on Delivery (COD)?",
    answer: "Yes! Cash on Delivery is available across 19,000+ Indian pincodes. You can also pay via UPI QR to the delivery agent upon doorstep arrival.",
    category: "Payments"
  }
];

export default function FAQClient({ initialFaqs = [] }) {
  const [faqs, setFaqs] = useState(initialFaqs.length > 0 ? initialFaqs : FALLBACK_FAQS);
  const [loading, setLoading] = useState(initialFaqs.length === 0);
  const [openIdxs, setOpenIdxs] = useState([0]); // first one open by default
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live FAQs from API
  useEffect(() => {
    let isMounted = true;
    const fetchFaqs = async () => {
      try {
        const res = await fetch('/api/faqs', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.faqs) && data.faqs.length > 0) {
            setFaqs(data.faqs);
          }
        }
      } catch (err) {
        console.warn('Using default FAQs fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFaqs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    faqs.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [faqs]);

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  // Accordion toggle
  const toggleFaq = (idx) => {
    setOpenIdxs(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const expandAll = () => {
    setOpenIdxs(filteredFaqs.map((_, i) => i));
  };

  const collapseAll = () => {
    setOpenIdxs([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      <Breadcrumb items={[{ name: 'FAQ', url: '/faq' }]} />

      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] bg-gold-500/10 text-gold-700 dark:text-gold-400 border border-gold-500/20 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Artisan Help Desk
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          Clear, instant guidance regarding hand-embroidery application, pure copper bottle care, order dispatch timelines, and our 7-day doorstep replacement promise.
        </p>
      </div>

      {/* Search & Action Controls */}
      <div className="space-y-4">
        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. stitching, copper, return, COD)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-[#1C120B] border border-gold-500/30 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                    ? 'bg-maroon-700 text-white shadow-md dark:bg-gold-500 dark:text-maroon-950 scale-105'
                    : 'bg-stone-100 dark:bg-[#1E140D] text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-gold-500/20'
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse all toggles */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 px-1">
          <span>Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors font-medium"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* FAQs Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 ethnic-card rounded-2xl border border-dashed border-gold-500/30 p-8 space-y-3">
            <p className="text-stone-500 text-sm">No questions matched "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-xs text-maroon-700 dark:text-gold-400 font-bold hover:underline"
            >
              Clear filters and show all FAQs
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIdxs.includes(idx);
            return (
              <div
                key={faq.id || idx}
                className={`ethnic-card rounded-2xl overflow-hidden border transition-all duration-200 ${isOpen
                    ? 'border-gold-500/50 shadow-md bg-stone-50/50 dark:bg-[#180E09]'
                    : 'border-gold-500/20 hover:border-gold-500/35 bg-white dark:bg-[#140D08]'
                  }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-md bg-gold-500/15 text-gold-700 dark:text-gold-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      Q
                    </span>
                    <span className="leading-snug">{faq.question}</span>
                  </div>
                  <div className="shrink-0 p-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-gold-600 transition-transform">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-gold-500/10 mt-1 pl-12 animate-fadeIn">
                    <p>{faq.answer}</p>
                    {faq.category && (
                      <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-medium bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                        {faq.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Help Banner */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-transparent to-gold-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Instant Concierge Support
            </span>
          </div>
          <h3 className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
            Have a custom order or bulk inquiry?
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Connect directly with our Jaipur artisan workshop on WhatsApp. We typically respond in under 15 minutes.
          </p>
        </div>

        <a
          href="https://wa.me/917065120322?text=Namaste!%20I%20have%20a%20question%20regarding%20Trio%20Enterprises%20products."
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold flex items-center gap-2.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 border-emerald-500/40 text-white shadow-lg shadow-emerald-900/30 hover:scale-105 transition-all"
        >
          <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
