import React from 'react';
import { Sparkles, Flame, Heart, Crown, Award, Tag } from 'lucide-react';

export const Badge = ({ type, text, size = "sm" }) => {
  const sizeClass = size === "xs" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1";

  switch (type) {
    case 'bestseller':
    case 'Best Seller':
      return (
        <span className={`badge-ribbon badge-bestseller inline-flex items-center gap-1 ${sizeClass}`}>
          <Crown className="w-3 h-3" />
          {text || 'Best Seller'}
        </span>
      );
    case 'festival':
    case 'Festival Special':
      return (
        <span className={`badge-ribbon badge-festival inline-flex items-center gap-1 ${sizeClass}`}>
          <Sparkles className="w-3 h-3" />
          {text || 'Festival Special'}
        </span>
      );
    case 'wedding':
    case 'Wedding Special':
      return (
        <span className={`badge-ribbon badge-wedding inline-flex items-center gap-1 ${sizeClass}`}>
          <Heart className="w-3 h-3" />
          {text || 'Wedding Special'}
        </span>
      );
    case 'handmade':
    case 'Handmade':
      return (
        <span className={`badge-ribbon badge-handmade inline-flex items-center gap-1 ${sizeClass}`}>
          <Award className="w-3 h-3" />
          {text || 'Handmade'}
        </span>
      );
    case 'trending':
    case 'Trending':
      return (
        <span className={`badge-ribbon badge-trending inline-flex items-center gap-1 ${sizeClass}`}>
          <Flame className="w-3 h-3" />
          {text || 'Trending'}
        </span>
      );
    case 'new':
    case 'New Arrival':
      return (
        <span className={`badge-ribbon badge-new inline-flex items-center gap-1 ${sizeClass}`}>
          <Sparkles className="w-3 h-3" />
          {text || 'New'}
        </span>
      );
    case 'discount':
      return (
        <span className={`badge-ribbon bg-maroon-700 text-white font-black border border-white/30 inline-flex items-center gap-1 ${sizeClass}`}>
          <Tag className="w-3 h-3" />
          {text}
        </span>
      );
    default:
      return (
        <span className={`badge-ribbon bg-stone-800 text-stone-100 font-bold ${sizeClass}`}>
          {text}
        </span>
      );
  }
};

export default Badge;
