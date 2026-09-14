'use client';
import React, { useState } from 'react';

export default function WhatsAppFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = '919876543210';
  const defaultMessage = encodeURIComponent('Namaste! I would like to know more about your handcrafted products.');

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 flex items-center gap-3">
      {/* Tooltip on hover/desktop */}
      <div
        className={`hidden sm:flex items-center px-3 py-1.5 rounded-full bg-stone-900/90 dark:bg-stone-950/90 text-white text-xs font-medium backdrop-blur-md shadow-xl border border-white/10 transition-all duration-300 pointer-events-none ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2 shrink-0" />
        <span>Chat with Artisan Desk</span>
      </div>

      {/* Floating Button */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${defaultMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
      >
        {/* Subtle pulsing background ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none" />

        {/* WhatsApp Icon */}
        <img
          src="/whatsapp.png"
          alt="WhatsApp"
          className="relative w-8 h-8 object-contain drop-shadow-md group-hover:rotate-6 transition-transform duration-300"
        />
      </a>
    </div>
  );
}
