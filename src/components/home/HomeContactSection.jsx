'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiBase } from '../../lib/api/store';
import InquiryTopicDropdown, { INQUIRY_TOPICS } from '../common/InquiryTopicDropdown';

export default function HomeContactSection() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Custom Bridal Patch Order',
    orderRef: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      addToast('Please provide your name, email, and message.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.orderRef?.trim()
          ? `${form.subject} [Ref: ${form.orderRef.trim()}]`
          : form.subject,
        message: form.message.trim(),
      };

      // 1. Try local storefront API route
      let res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 2. Fallback to external backend if needed
      if (!res.ok) {
        const apiBase = getApiBase();
        if (apiBase.startsWith('http')) {
          res = await fetch(`${apiBase}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        addToast('Thank you! Your inquiry has been sent to our artisan coordination desk.', 'success');
        setForm({
          name: '',
          email: '',
          phone: '',
          subject: 'Custom Bridal Patch Order',
          orderRef: '',
          message: '',
        });
      } else {
        throw new Error(data.error || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error('Home contact submission error:', err);
      addToast(err.message || 'Could not send message. Please try WhatsApp support.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="relative rounded-3xl overflow-hidden border-2 border-gold-500/30 bg-gradient-to-br from-[#1C120B] via-[#140D08] to-[#1F0C12] text-stone-200 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Subtle decorative glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-maroon-700/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Guild Info & Instant Support Options */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                Artisan Support &amp; Custom Orders
              </span>

              <h2 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
                Connect Directly with Our <span className="text-gold-300">Karigar Desk</span>
              </h2>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Whether you need custom bridal zardosi embroidery, bulk corporate pooja gifting, or delivery assistance, our team in Jaipur is ready to help.
              </p>
            </div>

            {/* Quick Contact Badges */}
            <div className="space-y-3">
              <a
                href="https://wa.me/917065120322"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-gold-500/20 hover:border-gold-500/60 hover:bg-gold-500/10 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white block">WhatsApp Direct Chat</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Instant Reply
                    </span>
                  </div>
                  <p className="text-stone-400">+91 7065120322 (Click to chat now)</p>
                </div>
              </a>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-gold-500/20">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-xs min-w-0">
                  <span className="font-bold text-white block">Phone Support</span>
                  <p className="text-stone-400">
                    <a href="tel:+917065120322" className="hover:text-gold-400 font-semibold">+91 7065120322 (Mon - Sat, 10 AM - 7 PM)</a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-gold-500/20">
                <div className="w-10 h-10 rounded-xl bg-maroon-600/30 text-rose-300 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs min-w-0">
                  <span className="font-bold text-white block">Patron Care Email</span>
                  <p className="text-stone-400">care@trioenterprises.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-gold-500/20">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs min-w-0">
                  <span className="font-bold text-white block">Office &amp; Headquarters (Trio Enterprises)</span>
                  <p className="text-stone-300 font-medium leading-relaxed">
                    Attn: Kashyap ji<br />
                    UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad, Near R.B.A COLLEGE, 121001
                  </p>
                </div>
              </div>
            </div>

            {/* Link to Full Dedicated Contact Page */}
            <div className="pt-2 flex items-center justify-between border-t border-gold-500/20">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" /> Replies within 2 to 4 business hours
              </span>
              <Link
                href="/contact"
                className="text-gold-400 hover:text-gold-300 font-bold text-xs inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Full Contact Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Embedded Interactive Inquiry Form */}
          <div className="lg:col-span-7 bg-[#170E09]/90 backdrop-blur-md rounded-3xl border border-gold-500/40 p-6 sm:p-8 shadow-xl">
            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-white">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Your message has been logged directly into our admin desk and our artisan coordinator will respond shortly.
                </p>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
                  >
                    Send Another Inquiry
                  </button>
                  <a
                    href="https://wa.me/917065120322"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2"
                  >
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" /> Chat on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Send an Inquiry or Custom Request
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Fill out the form below to receive customized pricing, bulk estimates, or artisan assistance.
                  </p>
                </div>

                {/* Inquiry Topic Dropdown - Best UI */}
                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-gold-300 flex items-center justify-between uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      Choose Inquiry Topic <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[11px] font-normal text-gold-400 lowercase tracking-normal">
                      5 specialized options
                    </span>
                  </label>
                  <InquiryTopicDropdown
                    value={form.subject}
                    onChange={(topicLabel) => setForm((prev) => ({ ...prev, subject: topicLabel }))}
                    theme="dark"
                  />
                </div>

                {/* Main Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-300">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Radhika Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-gold-500/30 text-white placeholder:text-stone-500 outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-300">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. radhika@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-gold-500/30 text-white placeholder:text-stone-500 outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-300">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+91 98234 56789"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-gold-500/30 text-white placeholder:text-stone-500 outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-300">Order ID or Custom Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Order # or specific dimension"
                        value={form.orderRef}
                        onChange={(e) => setForm({ ...form, orderRef: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-gold-500/30 text-white placeholder:text-stone-500 outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-300">Requirements &amp; Message *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Please tell us about your required designs, quantity, or delivery timeline..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-gold-500/30 text-white placeholder:text-stone-500 outline-none focus:border-gold-400 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full sm:w-auto py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Inquiry to Guild</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-stone-400">
                      🔒 Your contact information is kept strictly private.
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
