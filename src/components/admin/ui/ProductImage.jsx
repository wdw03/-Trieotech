'use client';
import React, { useState } from 'react';
import { Sparkles, Flower2, Droplet, Layers, Package, ZoomIn, Eye } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox.jsx';

const categoryIcons = {
  'Patches': Sparkles,
  'Flower Bunch': Flower2,
  'Bottle': Droplet,
  'Towel / Gamcha': Layers,
  'Cup Chain': Sparkles,
  'Paranda': Sparkles,
  'Aasan': Layers,
  'Chudi Ring': Sparkles,
  'More Products': Package
};

const categoryGradients = {
  'Patches': 'from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-amber-500/30 text-amber-300',
  'Flower Bunch': 'from-pink-500/20 via-rose-500/20 to-amber-500/20 border-pink-500/30 text-pink-300',
  'Bottle': 'from-orange-500/20 via-amber-600/20 to-yellow-500/20 border-orange-500/30 text-orange-300',
  'Towel / Gamcha': 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
  'Cup Chain': 'from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border-purple-500/30 text-purple-300',
  'Paranda': 'from-yellow-500/20 via-amber-500/20 to-red-500/20 border-yellow-500/30 text-yellow-300',
  'Aasan': 'from-red-500/20 via-rose-500/20 to-amber-500/20 border-red-500/30 text-red-300',
  'Chudi Ring': 'from-amber-400/20 via-yellow-500/20 to-orange-500/20 border-amber-400/30 text-amber-300',
  'More Products': 'from-indigo-500/20 via-blue-500/20 to-slate-500/20 border-indigo-500/30 text-indigo-300'
};

export const ProductImage = ({
  src,
  alt = 'Product photo',
  category = 'Patches',
  className = 'w-12 h-12 rounded-xl',
  images = [],
  product = null,
  enableLightbox = false,
  showBadgeCount = false
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const IconComponent = categoryIcons[category] || Package;
  const gradientClass = categoryGradients[category] || 'from-indigo-500/20 to-slate-800 border-slate-700 text-indigo-300';

  const allImages = images.length > 0 ? images : (src ? [src] : []);

  if (!src || error) {
    return (
      <div
        className={`${className} bg-gradient-to-br ${gradientClass} border flex flex-col items-center justify-center p-1 relative overflow-hidden shrink-0 shadow-inner`}
        title={alt}
      >
        <IconComponent className="w-1/2 h-1/2 opacity-80" />
        <span className="text-[8px] font-bold tracking-tighter uppercase opacity-75 truncate max-w-full text-center">
          {category.split(' ')[0]}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative group shrink-0 overflow-hidden ${className} border border-slate-700/60 bg-slate-900 shadow-sm ${enableLightbox ? 'cursor-pointer' : ''}`}
        onClick={() => enableLightbox && setLightboxOpen(true)}
      >
        {/* Loading Shimmer Skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-inherit" />
        )}

        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full object-cover transition-all duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
            ${enableLightbox ? 'group-hover:scale-110' : ''}
          `}
          loading="lazy"
        />

        {/* Hover Lightbox Indicator Icon */}
        {enableLightbox && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <ZoomIn className="w-4 h-4 drop-shadow" />
          </div>
        )}

        {/* Photos Count Badge */}
        {showBadgeCount && allImages.length > 1 && (
          <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md border border-white/10 shadow">
            +{allImages.length - 1}
          </span>
        )}
      </div>

      {/* Lightbox Modal */}
      {enableLightbox && (
        <ImageLightbox
          images={allImages}
          initialIndex={0}
          product={product || { name: alt, category }}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
