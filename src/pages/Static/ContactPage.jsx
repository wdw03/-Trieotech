import React, { useState } from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ContactPage = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast('Thank you for contacting Trio Ecart! An artisan coordinator will reply within 4 hours.', 'success');
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO
        title="Contact Trio Ecart | Artisan Support & Inquiries"
        description="Get in touch with Trio Ecart for custom bridal patch orders, bulk pooja thali gifting, copper jug requirements, and delivery support."
      />

      <Breadcrumb items={[{ name: 'Contact Us', url: '/contact' }]} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Contact Cards */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> We Are Here to Assist
            </span>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              Get in Touch with Our Artisan Guild
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed">
              Have questions about custom bridal patches, wholesale festival orders, or shipment status? Our team is at your service.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Phone &amp; WhatsApp Support</span>
                <p className="text-stone-500">+91 98765 43210</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-maroon-700/20 text-maroon-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Email Desk</span>
                <p className="text-stone-500">care@trioecart.com</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700/20 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Workshop &amp; Studio</span>
                <p className="text-stone-500">Johari Bazaar Craft Quarter, Jaipur 302003, Rajasthan</p>
              </div>
            </div>

            <div className="ethnic-card p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-900 dark:text-ivory-100 block">Operating Hours</span>
                <p className="text-stone-500">Mon - Sat: 10:00 AM - 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="md:col-span-7 ethnic-card p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
            Send an Inquiry or Custom Request
          </h2>

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Inquiry Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Bridal Patch Order"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 outline-none"
              />
            </div>

            <button
              type="submit"
              className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-maroon-md"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
