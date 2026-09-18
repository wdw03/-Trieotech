'use client';
import React from 'react';
import Link from 'next/link';
import { useAdmin } from '../../../context/AdminContext.jsx';

export const TrioLogo = ({
  className = '',
  showTagline = true,
  isCompact = false,
  badgeText
}) => {
  const { isSeoManager } = useAdmin();
  const isSeo = isSeoManager ? isSeoManager() : false;
  const targetHref = isSeo ? '/admin/cms/home' : '/admin';
  const effectiveBadge = badgeText || (isSeo ? 'SEO' : 'ADMIN');

  return (
    <Link href={targetHref} className={`inline-flex items-center gap-2.5 group select-none shrink-0 min-w-0 ${className}`}>
      {/* Brand Logo Emblem */}
      <div className={`relative ${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-amber-500/50 via-rose-700/40 to-amber-500/50 shadow-md group-hover:shadow-amber-500/20 transition-all duration-300 shrink-0`}>
        <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden border border-amber-500/40">
          <img
            src="/logo.png"
            alt="Trio Enterprises"
            className="w-full h-full object-contain p-0.5 transform group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`font-black tracking-tight text-white group-hover:text-amber-400 transition-colors truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
            TRIO <span className="text-amber-400 font-bold">ENTERPRISES</span>
          </span>
          {effectiveBadge && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-widest uppercase ${
              isSeo
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {effectiveBadge}
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-amber-500/90 leading-none mt-0.5 transition-colors truncate">
            Ethnic Craft Guild
          </span>
        )}
      </div>
    </Link>
  );
};

export default TrioLogo;
