'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Crown,
  Package,
  Truck,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const INQUIRY_TOPICS = [
  {
    id: 'bridal',
    label: 'Custom Bridal Patch Order',
    badge: 'Artisan Bespoke',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    desc: 'Bespoke zardosi, velvet cutwork & bridal lehenga appliques',
    icon: Crown,
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    id: 'wholesale',
    label: 'Wholesale / Bulk Gifting',
    badge: 'B2B & Bulk',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    desc: 'Corporate gifting, festival hamper packs & boutique supply',
    icon: Package,
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'delivery',
    label: 'Order & Delivery Status',
    badge: 'Quick Support',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    desc: 'Real-time dispatch updates, courier tracking & ETA',
    icon: Truck,
    accentBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'pooja',
    label: 'Pooja Essentials Inquiry',
    badge: 'Sacred Mandir',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    desc: 'Pure velvet aasans, brass diyas & sacred temple decor',
    icon: Sparkles,
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'general',
    label: 'General Question',
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find currently selected topic object
  const selectedTopic =
    INQUIRY_TOPICS.find((t) => t.label === value) || INQUIRY_TOPICS[0];
  const SelectedIcon = selectedTopic.icon;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (topic) => {
    if (onChange) {
      onChange(topic.label);
    }
    setIsOpen(false);
  };

  const isDarkTheme = theme === 'dark';

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full text-left font-sans select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[58px] p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 cursor-pointer ${
          isDarkTheme
            ? isOpen
              ? 'bg-stone-900 border-gold-500 ring-2 ring-gold-500/30'
              : 'bg-stone-900/90 border-gold-500/30 hover:border-gold-500/70 hover:bg-stone-900'
            : isOpen
            ? 'bg-white dark:bg-stone-900 border-gold-500 ring-2 ring-gold-500/30'
            : 'bg-ivory-100/90 dark:bg-stone-900/90 border-gold-500/30 hover:border-gold-500/70 hover:bg-white dark:hover:bg-stone-900'
        }`}
      >
        {/* Left: Topic Icon Box */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 ${
            selectedTopic.accentBg
          } ${isOpen ? 'scale-105' : ''}`}
        >
          <SelectedIcon className="w-5 h-5" />
        </div>

        {/* Center: Selected Topic Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-bold truncate ${
                isDarkTheme
                  ? 'text-white'
                  : 'text-stone-900 dark:text-ivory-100'
              }`}
            >
              {selectedTopic.label}
            </span>
            <span
              className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${selectedTopic.badgeClass}`}
            >
              {selectedTopic.badge}
            </span>
          </div>
          <p
            className={`text-[11px] truncate mt-0.5 ${
              isDarkTheme
                ? 'text-stone-400'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {selectedTopic.desc}
          </p>
        </div>

        {/* Right: Dropdown Chevron */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isOpen
              ? 'bg-gold-500/20 text-gold-500'
              : isDarkTheme
              ? 'text-stone-400 hover:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-gold-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            isDarkTheme
              ? 'bg-[#18100A]/98 border-gold-500/40 shadow-gold-950/60'
              : 'bg-white/98 dark:bg-[#18100A]/98 border-gold-500/40 shadow-2xl'
          }`}
        >
          {/* Header Banner */}
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-bold uppercase tracking-wider ${
              isDarkTheme
                ? 'bg-gold-500/10 border-gold-500/20 text-gold-300'
                : 'bg-gold-500/10 border-gold-500/20 text-gold-800 dark:text-gold-300'
            }`}
          >
            <span>Choose Inquiry Category</span>
            <span className="text-[10px] font-normal lowercase tracking-normal opacity-80">
              Tap any option to select
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto divide-y divide-gold-500/10 py-1">
            {INQUIRY_TOPICS.map((topic) => {
              const TopicIcon = topic.icon;
              const isSelected = topic.label === selectedTopic.label;

              return (
                <button
                  key={topic.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(topic)}
                  className={`w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group ${
                    isSelected
                      ? isDarkTheme
                        ? 'bg-gold-500/20 border-l-4 border-l-gold-400'
                        : 'bg-gold-500/15 dark:bg-gold-500/20 border-l-4 border-l-gold-500'
                      : isDarkTheme
                      ? 'hover:bg-white/5 border-l-4 border-l-transparent'
                      : 'hover:bg-stone-50 dark:hover:bg-white/5 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Left Topic Icon */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                      topic.accentBg
                    }`}
                  >
                    <TopicIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* Middle Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isSelected
                            ? isDarkTheme
                              ? 'text-gold-300'
                              : 'text-maroon-700 dark:text-gold-300 font-extrabold'
                            : isDarkTheme
                            ? 'text-stone-200 group-hover:text-white'
                            : 'text-stone-800 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-white'
                        }`}
                      >
                        {topic.label}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${topic.badgeClass}`}
                      >
                        {topic.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 line-clamp-1 sm:line-clamp-none ${
                        isDarkTheme
                          ? 'text-stone-400 group-hover:text-stone-300'
                          : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'
                      }`}
                    >
                      {topic.desc}
                    </p>
                  </div>

                  {/* Right Checkmark */}
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gold-500/20 group-hover:border-gold-500/50 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note on mobile & desktop */}
          <div
            className={`px-4 py-2 border-t text-[10px] text-center ${
              isDarkTheme
                ? 'bg-stone-950/60 border-gold-500/20 text-stone-400'
                : 'bg-stone-50 dark:bg-stone-950/60 border-gold-500/20 text-stone-500 dark:text-stone-400'
            }`}
          >
            Direct communication with Jaipur Master Karigar &amp; Guild Support
          </div>
        </div>
      )}
    </div>
  );
}
