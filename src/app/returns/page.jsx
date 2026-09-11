export const metadata = {
  title: '7-Day Return & Replacement Policy | Trio Enterprises',
  description: 'Learn how our hassle-free 7-day doorstep replacement and return process protects every handcrafted artifact purchase.',
  alternates: {
    canonical: '/returns',
  },
};

import React from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import { RotateCcw, ShieldCheck, CheckCircle2, Camera, Clock, ArrowRight } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Breadcrumb items={[{ name: 'Returns Policy', url: '/returns' }]} />

      <div className="space-y-2 text-center sm:text-left">
        <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
          7-Day Hassle-Free Returns &amp; Replacements
        </h1>
        <p className="text-xs text-stone-500">
          Your complete satisfaction with our Indian handcrafted creations is our sacred promise.
        </p>
      </div>

      {/* Direct Action Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-stone-100 dark:to-stone-900 border border-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-serif font-black text-lg text-stone-900 dark:text-ivory-100">
            Have a damaged or defective item?
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Raise an instant return ticket directly from your account with 3 photos of the received item.
          </p>
        </div>
        <Link
          href="/profile/orders"
          className="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-maroon-sm"
        >
          <span>Go to My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            1. 7-Day Doorstep Replacement Guarantee
          </h2>
          <p>
            If any handcrafted item arrives damaged in transit, with defective zari embroidery, or does not match your ordered specifications, you are eligible for an immediate replacement or 100% full refund within <strong>7 days</strong> of parcel receipt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-maroon-700 dark:text-gold-400" />
            2. Simple 3-Step Online Ticket Process
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-800/60 border border-gold-500/20 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-xs text-stone-900 dark:text-ivory-100">Raise Ticket</h3>
              <p className="text-[11px] text-stone-500">
                Go to "My Orders", click "Return / Refund Ticket" on your delivered order.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-800/60 border border-gold-500/20 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-xs text-stone-900 dark:text-ivory-100">Upload 3 Photos</h3>
              <p className="text-[11px] text-stone-500">
                Upload clear photos showing the damage, defect, or package label.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-800/60 border border-gold-500/20 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-xs text-stone-900 dark:text-ivory-100">Verification &amp; Refund</h3>
              <p className="text-[11px] text-stone-500">
                Admin verifies claim within 24 hours. Doorstep pickup and refund/replacement dispatched.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
            3. Conditions for Return
          </h2>
          <p>
            Items should be in unused condition with original tags intact. Custom-made customized zari orders are replaced if defective upon delivery.
          </p>
        </section>
      </div>
    </div>
  );
}
