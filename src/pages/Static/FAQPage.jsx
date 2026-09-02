import React, { useState } from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { ChevronDown, Sparkles, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: "Are all Trio Ecart embroidery patches authentic handmade zardosi?",
    a: "Yes. Every patch in our collection is hand-stitched by skilled karigars using traditional wooden addas, genuine metallic bullion coils (zari), glass zarkans, and faux pearls. We do not sell flat machine-printed imitations."
  },
  {
    q: "How do I stitch or affix embroidery appliques to lehengas, dupattas, or blouses?",
    a: "Our applique patches feature reinforced backing that can easily be hand-stitched along the borders with a matching needle and thread, or fabric-glued using high-grade craft adhesive before fine edge stitching for permanent bridal wear."
  },
  {
    q: "Is your copper water bottle 100% pure copper?",
    a: "Yes. Our hammered and plain matte copper bottles are crafted from 100% lab-tested, food-grade pure copper without inner chemical lacquers or lead, ensuring optimal Ayurvedic Tamra Jal health benefits."
  },
  {
    q: "How long does domestic delivery take across India?",
    a: "All orders are dispatched within 24 business hours from our Jaipur craft center. Metro cities receive deliveries in 2-3 business days, while other locations take 3-5 days via BlueDart Air Express."
  },
  {
    q: "What is your return and replacement policy?",
    a: "We offer a 7-day doorstep replacement guarantee on all items. If an item arrives transit-damaged or differs from your expectations, contact our WhatsApp support at +91 98765 43210 for an instant replacement or full refund."
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes! Cash on Delivery is available across 19,000+ Indian pincodes. You can also pay via UPI QR to the delivery agent upon doorstep arrival."
  }
];

export const FAQPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Frequently Asked Questions | Trio Ecart" />
      <Breadcrumb items={[{ name: 'FAQ', url: '/faq' }]} />

      <div className="text-center space-y-2 max-w-lg mx-auto">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Help Center
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-stone-500">
          Find instant answers regarding craft materials, patch applications, copper maintenance, and delivery.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="ethnic-card rounded-2xl overflow-hidden border border-gold-500/20 transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gold-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-gold-500/10">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQPage;
