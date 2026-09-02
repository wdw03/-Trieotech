import React from 'react';
import { Link } from 'react-router-dom';

export const TrioLogo = ({ className = "h-10", showTagline = true }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Sacred Royal Emblem / Mandala Lotus */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-maroon-700 via-maroon-900 to-maroon-950 p-[1.5px] shadow-maroon-sm group-hover:shadow-gold-md transition-all duration-300">
        <div className="w-full h-full rounded-[10px] bg-gradient-to-tr from-[#1E0D0D] to-[#3B1515] flex items-center justify-center border border-gold-500/40">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300">
            {/* Outer Petals */}
            <path d="M20 4C20 4 23 11 28 14C33 17 40 20 40 20C40 20 33 23 28 26C23 29 20 36 20 36C20 36 17 29 12 26C7 23 0 20 0 20C0 20 7 17 12 14C17 11 20 4 20 4Z" fill="url(#goldGrad)" opacity="0.85"/>
            {/* Center Lotus */}
            <circle cx="20" cy="20" r="4.5" fill="#FAF7F2" stroke="#C5A028" strokeWidth="1.5" />
            <path d="M16 20C16 17.79 17.79 16 20 16C22.21 16 24 17.79 24 20C24 22.21 22.21 24 20 24C17.79 24 16 22.21 16 20Z" fill="#8B1A1A"/>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F5D061" />
                <stop offset="0.5" stopColor="#C5A028" />
                <stop offset="1" stopColor="#8B1A1A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span className="font-brand font-black text-xl sm:text-2xl tracking-wider text-maroon-800 dark:text-gold-400 group-hover:text-gold-600 transition-colors leading-none">
          TRIO <span className="text-gold-600 dark:text-ivory-100 font-normal">ECART</span>
        </span>
        {showTagline && (
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-gold-700 dark:text-gold-500/80 -mt-0.5">
            Ethnic Craft Guild
          </span>
        )}
      </div>
    </Link>
  );
};

export default TrioLogo;
