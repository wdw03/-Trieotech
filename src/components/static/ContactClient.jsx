'use client';
import React, { useState } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getApiBase } from '../../lib/api/store';

const INQUIRY_TOPICS = [
  'Custom Bridal Patch Order',
  'Wholesale / Bulk Gifting',
  'Order & Delivery Status',
  'Copper Drinkware Query',
  'Pooja Essentials Inquiry',
  'General Question',
];

export default function ContactClient() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Custom Bridal Patch Order',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      addToast('Please fill in your name, email, and message.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try local API first
      let res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      // 2. If local fails or 404, try external backend
      if (!res.ok) {
        const apiBase = getApiBase();
        if (apiBase.startsWith('http')) {
          res = await fetch(`${apiBase}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
        }
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        addToast('Thank you! Your message has been sent to our artisan coordination desk.', 'success');
        setForm({
          name: '',
          email: '',
          phone: '',
          subject: 'Custom Bridal Patch Order',
          message: '',
        });
      } else {
        throw new Error(data.error || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error('Contact submission failed:', err);
      addToast(err.message || 'Could not send message. Please try WhatsApp support.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <Breadcrumb items={[{ name: 'Contact Us', url: '/contact' }]} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Cards */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Artisan Support Desk
            </span>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              Get in Touch with Our Craft Guild
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Have questions about custom bridal zardosi patches, bulk pooja decor orders, or shipment status? Our dedicated team is at your service.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5 hover:border-gold-500/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">WhatsApp Chat Desk</span>
                <p className="text-stone-500 dark:text-stone-400">+91 98765 43210 (Instant Reply)</p>
              </div>
            </a>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Phone Support</span>
                <p className="text-stone-500 dark:text-stone-400">+91 98765 43210</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-maroon-700/20 text-maroon-700 dark:text-maroon-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Email Desk</span>
                <p className="text-stone-500 dark:text-stone-400">care@trioenterprises.com</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Workshop &amp; Studio</span>
                <p className="text-stone-500 dark:text-stone-400">Johari Bazaar Craft Quarter, Jaipur 302003, Rajasthan</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Operating Hours</span>
                <p className="text-stone-500 dark:text-stone-400">Mon - Sat: 10:00 AM - 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="md:col-span-7 ethnic-card p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
          {submitted ? (
            <div className="text-center py-10 space-y-4 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
                Inquiry Received!
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                Your message has been directly recorded in our coordination desk and forwarded to our artisan team. We typically respond within 2 to 4 business hours.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn-secondary py-2.5 px-5 text-xs font-bold"
                >
                  Send Another Message
                </button>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                  Send an Inquiry or Custom Request
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Fill in your details below and our team will get back to you promptly.
                </p>
              </div>

              {/* Quick Topic Pills */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] text-stone-700 dark:text-stone-300 block">
                  Select Inquiry Topic:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INQUIRY_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setForm({ ...form, subject: topic })}
                      className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                        form.subject === topic
                          ? 'bg-maroon-700 text-white border-maroon-700 font-bold shadow-xs'
                          : 'bg-ivory-100 dark:bg-stone-900 border-gold-500/30 text-stone-700 dark:text-stone-300 hover:border-gold-500'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. radhika@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+91 98234 56789"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Custom Bridal Patch Order"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">Message &amp; Requirements *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please describe your requirements, quantity needed, or festival timeline..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none focus:border-gold-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-maroon-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message to Guild</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
