'use client';

import React from 'react';
import {
  ChevronDown,
  Check,
  Crown,
  Package,
  Truck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const INQUIRY_TOPICS = [
  {
    id: 'bridal',
    label: 'Custom Bridal Patch Order',
    shortLabel: 'Bridal Patch',
    badge: 'Artisan Bespoke',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    desc: 'Bespoke zardosi, velvet cutwork & bridal lehenga appliques',
    icon: Crown,
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    id: 'wholesale',
    label: 'Wholesale / Bulk Gifting',
    shortLabel: 'Wholesale / Bulk',
    badge: 'B2B & Bulk',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    desc: 'Corporate gifting, festival hamper packs & boutique supply',
    icon: Package,
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'delivery',
    label: 'Order & Delivery Status',
    shortLabel: 'Order & Delivery',
    badge: 'Track Order',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    desc: 'Real-time dispatch updates, courier tracking & ETA',
    icon: Truck,
    accentBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'pooja',
    label: 'Pooja Essentials Inquiry',
    shortLabel: 'Pooja Essentials',
    badge: 'Sacred Mandir',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    desc: 'Pure velvet aasans, brass diyas & sacred temple decor',
    icon: Sparkles,
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'general',
    label: 'General Question',
    shortLabel: 'General Question',
    badge: 'Guild Care',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    desc: 'Product care, payments, returns & artisan collaborations',
    icon: HelpCircle,
    accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
];

export default function InquiryTopicDropdown({
  value = 'Custom Bridal Patch Order',
  onChange,
  theme = 'auto', // 'auto' (light/dark adaptive) or 'dark' (fixed dark mode for dark sections)
  className = '',
}) {
  const selectedTopic =
    INQUIRY_TOPICS.find((t) => t.label === value) || INQUIRY_TOPICS[0];
  const SelectedIcon = selectedTopic.icon;
  const isDark = theme === 'dark';

  return (
    <div className={`w-full space-y-2.5 font-sans ${className}`}>
      {/* Interactive Dropdown Box with Left Icon & Right Chevron */}
      <div className="relative w-full group">
        {/* Left Topic Icon Box */}
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl border flex items-center justify-center pointer-events-none transition-transform group-hover:scale-105 z-10 ${
            selectedTopic.accentBg
          }`}
        >
          <SelectedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Native Dropdown Element for 100% Mobile and Desktop Reliability */}
        <select
          id="inquiry-topic-select"
          aria-label="Inquiry Topic Dropdown"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={`w-full h-14 pl-14 pr-28 sm:pr-36 rounded-2xl border-2 font-bold text-xs sm:text-sm outline-none transition-all duration-200 cursor-pointer appearance-none shadow-sm ${
            isDark
              ? 'bg-stone-900 border-gold-500/40 text-white hover:border-gold-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20'
              : 'bg-white dark:bg-stone-900 border-gold-500/40 text-stone-900 dark:text-ivory-100 hover:border-gold-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
          }`}
        >
          {INQUIRY_TOPICS.map((topic) => (
            <option
              key={topic.id}
              value={topic.label}
              className={
                isDark
                  ? 'bg-stone-900 text-stone-100 py-2 font-sans text-xs sm:text-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-ivory-100 py-2 font-sans text-xs sm:text-sm'
              }
            >
              {topic.label} — [{topic.badge}]
            </option>
          ))}
        </select>

        {/* Right Badge & Chevron Indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5 z-10">
          <span
            className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${selectedTopic.badgeClass}`}
          >
            {selectedTopic.badge}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-gold-500/20 text-gold-300'
                : 'bg-gold-500/20 text-gold-700 dark:text-gold-300'
            }`}
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Selected Topic Description Card */}
      <div
        className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-all ${
          isDark
            ? 'bg-gold-500/10 border-gold-500/20 text-stone-300'
            : 'bg-gold-500/10 dark:bg-stone-900/60 border-gold-500/20 text-stone-700 dark:text-stone-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0 animate-pulse" />
          <p className="text-[11px] sm:text-xs truncate font-medium">
            {selectedTopic.desc}
          </p>
        </div>
        <span
          className={`sm:hidden text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${selectedTopic.badgeClass}`}
        >
          {selectedTopic.badge}
        </span>
      </div>

      {/* Quick Tap Pills for 1-Touch Switching on Phone & PC */}
      <div className="pt-0.5 space-y-1">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider block ${
            isDark ? 'text-gold-400/80' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          Quick Select:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {INQUIRY_TOPICS.map((topic) => {
            const isCurrent = topic.label === value;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onChange && onChange(topic.label)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-maroon-700 text-white font-bold border-maroon-700 shadow-xs'
                    : isDark
                    ? 'bg-stone-900/80 border-gold-500/20 text-stone-300 hover:border-gold-500/50 hover:text-white'
                    : 'bg-ivory-100/90 dark:bg-stone-900 border-gold-500/20 text-stone-700 dark:text-stone-300 hover:border-gold-500/60'
                }`}
              >
                {isCurrent && <Check className="w-3 h-3 stroke-[3] text-gold-300" />}
                <span>{topic.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
