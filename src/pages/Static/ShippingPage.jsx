import React from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Truck, ShieldCheck, Clock, MapPin, Sparkles } from 'lucide-react';

export const ShippingPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Shipping & Delivery Policy | Trio Ecart" />
      <Breadcrumb items={[{ name: 'Shipping Policy', url: '/shipping' }]} />

      <div className="space-y-2 text-center sm:text-left">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Logistics &amp; Dispatch
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
          Shipping &amp; Delivery Policy
        </h1>
      </div>

      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            1. Free Express Shipping Threshold
          </h2>
          <p>
            We offer <strong>Free Express Air Shipping</strong> on all domestic orders above <strong>₹999</strong>. For orders below ₹999, a nominal flat courier fee of ₹70 is applied at checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            2. Processing &amp; Dispatch Timelines
          </h2>
          <p>
            All handcrafted items undergo careful quality checking and sacred eco-friendly packaging. Orders placed before 2:00 PM IST are dispatched on the same business day from our Jaipur craft center.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            3. Estimated Delivery Times
          </h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Metro Cities (Delhi, Mumbai, Bengaluru, Jaipur, Kolkata, Chennai):</strong> 2 - 3 business days</li>
            <li><strong>Rest of India:</strong> 3 - 5 business days</li>
            <li><strong>Remote &amp; North East Regions:</strong> 5 - 7 business days</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            4. Live SMS &amp; Email Tracking
          </h2>
          <p>
            As soon as your parcel is handed over to BlueDart or Delhivery, an automated tracking link and AWB tracking number will be sent via WhatsApp, SMS, and Email.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPage;
