'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/* ============================================================
   SELF-CONTAINED MOTION HOOKS (High performance, 60fps)
   ============================================================ */

// Scroll Reveal - fades/slides elements in when they enter viewport
export const useReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
};

// Parallax background hook
export const useParallaxBg = (speed = 0.25) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const parent = el.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        el.style.transform = `translateY(${rect.top * speed * -1}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return ref;
};

/* ============================================================
   SHARED LUXURY UI COMPONENTS
   ============================================================ */

export const SectionTitle = ({ subtitle, title, description }) => {
  const [ref, visible] = useReveal(0.12);
  return (
    <div
      ref={ref}
      className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <p className="text-[#d4af37] text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3 font-bold flex items-center justify-center gap-3 sm:gap-4">
        <span className={`h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]/70 transition-all duration-1000 delay-200 ${visible ? 'w-8 sm:w-12' : 'w-0'}`} />
        <Sparkles size={13} className="text-[#d4af37] animate-pulse shrink-0" />
        <span>{subtitle}</span>
        <Sparkles size={13} className="text-[#d4af37] animate-pulse shrink-0" />
        <span className={`h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]/70 transition-all duration-1000 delay-200 ${visible ? 'w-8 sm:w-12' : 'w-0'}`} />
      </p>

      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wider sm:tracking-widest text-white italic drop-shadow-2xl font-light">
        {title}
      </h2>

      {description && (
        <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-2xl mx-auto mt-4 leading-relaxed font-light px-4">
          {description}
        </p>
      )}

      <div className="flex gap-1.5 justify-center items-center mt-5 sm:mt-6">
        <div className={`h-[2px] bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8] rounded-full transition-all duration-1000 delay-500 ${visible ? 'w-16 sm:w-20' : 'w-0'}`} />
        <div className="h-[3px] w-[3px] bg-[#d4af37]/60 rounded-full animate-pulse" />
        <div className="h-[3px] w-[3px] bg-[#d4af37]/30 rounded-full animate-pulse delay-100" />
      </div>
    </div>
  );
};

export const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, visible] = useReveal(0.08);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </div>
  );
};

/* ============================================================
   GLOBAL STYLES / KEYFRAMES (Injected locally for Homepage)
   ============================================================ */

export const HomeStyles = () => (
  <style jsx global>{`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    @keyframes hero-up {
      from {
        opacity: 0;
        transform: translateY(45px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes ken-burns {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(1.08);
      }
    }

    @keyframes line-grow {
      from {
        width: 0;
        opacity: 0;
      }
      to {
        width: 2.5rem;
        opacity: 1;
      }
    }

    @keyframes progress {
      from {
        width: 0%;
      }
      to {
        width: 100%;
      }
    }

    @keyframes marquee {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(-50%);
      }
    }

    @keyframes spin-slow {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    @keyframes craft-twinkle {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.35;
        transform: scale(0.85);
      }
    }

    .gold-shimmer {
      background: linear-gradient(90deg, #d4af37 20%, #fff8dc 50%, #d4af37 80%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    .craft-gold-text {
      background: linear-gradient(100deg, #b8860b 0%, #f5e6b8 25%, #d4af37 50%, #f5e6b8 75%, #b8860b 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4.5s linear infinite;
    }

    .craft-twinkle {
      animation: craft-twinkle 2.2s ease-in-out infinite;
    }

    .craft-spin-slow {
      animation: spin-slow 16s linear infinite;
    }
  `}</style>
);
