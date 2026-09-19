import React from 'react';
import Link from 'next/link';

export const TrioLogo = ({ className = "h-auto", showTagline = true, isCompact = false }) => {
  return (
    <Link href="/" className={`inline-flex items-center gap-1.5 sm:gap-3 group select-none shrink-0 min-w-0 ${className}`}>
      {/* Brand Logo Emblem */}
      <div className={`relative ${isCompact ? 'sm:w-9 sm:h-9' : 'sm:w-10 sm:h-10'} w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center shrink-0`}>
        <img
          src="/logo.png"
          alt="Trio Enterprises"
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/products/image.png';
          }}
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col min-w-0 justify-center">
        <span className={`font-brand font-black text-[13px] xs:text-[15px] ${isCompact ? 'sm:text-xl' : 'sm:text-2xl'} tracking-normal xs:tracking-wider text-maroon-800 dark:text-gold-400 group-hover:text-gold-600 transition-all duration-300 leading-tight truncate`}>
          TRIO <span className="text-gold-600 dark:text-ivory-100 font-bold">ENTERPRISES</span>
        </span>
        {showTagline && (
          <span className={`text-[11px] sm:text-xs font-semibold text-gold-700 dark:text-gold-400/90 leading-tight mt-0.5 transition-all duration-300 truncate tracking-wide`}>
            Ethnic Craft Guild
          </span>
        )}
      </div>
    </Link>
  );
};

export default TrioLogo;
