import React from 'react';
import { Link } from 'react-router-dom';

export const TrioLogo = ({ className = "h-10", showTagline = true }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none shrink-0 ${className}`}>
      {/* Brand Logo Emblem */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-gold-500/50 via-maroon-700/40 to-gold-500/50 shadow-md group-hover:shadow-gold-md transition-all duration-300 shrink-0">
        <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#1A110B] flex items-center justify-center overflow-hidden border border-gold-500/40">
          <img
            src="/logo.png"
            alt="Trio Enterprises"
            className="w-full h-full object-contain p-1 transform group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/products/image.png';
            }}
          />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col min-w-0">
        <span className="font-brand font-black text-lg sm:text-2xl tracking-wider text-maroon-800 dark:text-gold-400 group-hover:text-gold-600 transition-colors leading-none truncate">
          TRIO <span className="text-gold-600 dark:text-ivory-100 font-bold">ENTERPRISES</span>
        </span>
        {showTagline && (
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-gold-700 dark:text-gold-500/90 mt-0.5 truncate">
            Ethnic Craft Guild
          </span>
        )}
      </div>
    </Link>
  );
};

export default TrioLogo;
