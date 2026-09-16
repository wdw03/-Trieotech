'use client';
import React, { useState } from 'react';
import { ProductImage } from './ProductImage.jsx';
import { ImageLightbox } from './ImageLightbox.jsx';
import { ZoomIn, Camera, Sparkles } from 'lucide-react';

export const ProductGalleryPreview = ({ product, compact = false }) => {
  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/products/pearl-zardosi-patch-1.jpg'];

  const [activeImage, setActiveImage] = useState(images[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // If a color variant is clicked, update active image
  const handleColorSelect = (color) => {
    if (color.image) {
      setActiveImage(color.image);
    }
  };

  const handleOpenLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <div
          onClick={() => handleOpenLightbox(images.indexOf(activeImage) !== -1 ? images.indexOf(activeImage) : 0)}
          className="relative group cursor-pointer"
        >
          <ProductImage
            src={activeImage}
            alt={product.name}
            category={product.category}
            className="w-14 h-14 rounded-xl border border-slate-700/80 shadow-md"
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <ZoomIn className="w-4 h-4" />
          </div>
          {images.length > 1 && (
            <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow border border-indigo-400">
              {images.length}
            </span>
          )}
        </div>

        {/* Mini Angle Thumbnails Strip */}
        {images.length > 1 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {images.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`
                    w-6 h-6 rounded-md overflow-hidden border transition-all
                    ${activeImage === img ? 'border-indigo-500 scale-110 shadow-sm' : 'border-slate-800 opacity-60 hover:opacity-100'}
                  `}
                  title={`View Angle ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {images.length > 3 && (
                <button
                  onClick={() => handleOpenLightbox(0)}
                  className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-[9px] font-bold flex items-center justify-center hover:bg-slate-700 transition-colors"
                  title="View all photos"
                >
                  +{images.length - 3}
                </button>
              )}
            </div>

            {/* Color Swatches that change image */}
            {product.colors && product.colors.length > 1 && (
              <div className="flex items-center gap-1 mt-0.5">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleColorSelect(c)}
                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-125 transition-transform"
                    style={{ backgroundColor: c.hex || '#D4AF37' }}
                    title={`Switch to color: ${c.name}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          product={product}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    );
  }

  // Full Gallery Card view
  return (
    <div className="space-y-3">
      <div
        onClick={() => handleOpenLightbox(images.indexOf(activeImage) !== -1 ? images.indexOf(activeImage) : 0)}
        className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-square max-h-64 flex items-center justify-center shadow-lg"
      >
        <img
          src={activeImage}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
          <ZoomIn className="w-5 h-5" />
          <span className="text-xs font-bold">Inspect High-Res</span>
        </div>
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`
                w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0
                ${activeImage === img ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'}
              `}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Color variant switcher buttons */}
      {product.colors && product.colors.length > 1 && (
        <div className="pt-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
            Color Variant Photos:
          </span>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c, i) => (
              <button
                key={i}
                onClick={() => handleColorSelect(c)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex || '#D4AF37' }} />
                <span className="text-[11px] truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        product={product}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};
