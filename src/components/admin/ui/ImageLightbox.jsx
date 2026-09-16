'use client';
import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Copy,
  Sparkles,
  Tag
} from 'lucide-react';

export const ImageLightbox = ({
  images = [],
  initialIndex = 0,
  product = null,
  isOpen = false,
  onClose = () => {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex] || images[0];

  const handleNext = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + currentImg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none animate-fadeIn">
      {/* Top Action Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {product && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base line-clamp-1">{product.name}</span>
                {product.badge && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {product.category} • Photo {currentIndex + 1} of {images.length}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700"
            title={isZoomed ? "Zoom Out" : "Zoom In"}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
          <a
            href={currentImg}
            download
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700"
            title="Download Full Resolution"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors border border-rose-500/30 ml-2"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative max-w-4xl max-h-[75vh] flex items-center justify-center overflow-hidden my-auto">
        <img
          src={currentImg}
          alt={product?.name || 'Product photo'}
          className={`
            max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-300
            ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}
          `}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Prev / Next Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-xl transition-all border border-slate-700/80"
              title="Previous Photo (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-xl transition-all border border-slate-700/80"
              title="Next Photo (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl max-w-full overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setIsZoomed(false); }}
              className={`
                relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0
                ${currentIndex === idx ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-transparent opacity-60 hover:opacity-100'}
              `}
            >
              <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
