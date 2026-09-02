import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { Search, Home, ShoppingBag, ArrowRight } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <SEO title="404 - Craft Page Not Found | Trio Ecart" />

      <div className="ethnic-card max-w-lg w-full p-8 sm:p-12 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30">
        <span className="font-serif font-black text-6xl sm:text-7xl text-maroon-800 dark:text-gold-400 block">
          404
        </span>

        <div className="space-y-2">
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
            Craft Page Lost in Translation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            The page you requested could not be located. Try searching our artisan catalog or return home.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Search patches, copper bottles, aasans..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-ivory-100 dark:bg-stone-900 text-stone-900 dark:text-ivory-100 rounded-full border border-gold-500/40 text-xs outline-none focus:border-maroon-700"
          />
          <Search className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-maroon-700 text-white rounded-full text-[11px] font-bold"
          >
            Search
          </button>
        </form>

        {/* Action CTAs */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/" className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link to="/shop" className="btn-outline-maroon py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            <span>Browse All</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
