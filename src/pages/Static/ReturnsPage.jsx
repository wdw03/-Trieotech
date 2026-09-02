import React from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { RotateCcw, ShieldCheck, CheckCircle2, Phone } from 'lucide-react';

export const ReturnsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Return & Replacement Policy | Trio Ecart" />
      <Breadcrumb items={[{ name: 'Returns Policy', url: '/returns' }]} />

      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
          7-Day Hassle-Free Returns &amp; Replacements
        </h1>
        <p className="text-xs text-stone-500">
          Your complete satisfaction with our Indian handcrafted creations is our sacred promise.
        </p>
      </div>

      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            1. 7-Day Doorstep Replacement Guarantee
          </h2>
          <p>
            If any item arrives damaged in transit, with defective zari embroidery, or does not match the product specifications on our website, you are eligible for an immediate replacement or 100% full refund within <strong>7 days</strong> of parcel receipt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            2. Simple WhatsApp Return Process
          </h2>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Send photos of the parcel and item to our artisan WhatsApp: <strong>+91 98765 43210</strong>.</li>
            <li>Our team will verify the request and schedule a free reverse pickup at your doorstep.</li>
            <li>Upon pickup, a replacement is dispatched immediately, or refund credited to your original UPI/Card account in 2-4 business days.</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            3. Conditions for Return
          </h2>
          <p>
            Items should be in unused, unwashed condition with original tags and packaging intact.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReturnsPage;
