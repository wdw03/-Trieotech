'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  PhoneCall,
  MapPin,
  ArrowRight,
  Package
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { searchProducts } from '../../data/products';
import { categories as fallbackCategories } from '../../data/categories';
import { fetchLiveProducts, fetchLiveCategories } from '../../lib/api/store';
import TrioLogo from '../common/TrioLogo';
import useDebounce from '../../hooks/useDebounce';

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, subtotal, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchLiveCategories()
      .then((cats) => {
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const debouncedSearch = useDebounce(searchQuery, 250);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Detect scroll for subtle header shadow elevation without layout shifts
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY || window.pageYOffset || 0;
          setIsScrolled(scrollPos > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Perform debounced search for instant dropdown
  useEffect(() => {
    let isCurrent = true;
    if (debouncedSearch.trim().length > 1) {
      const q = debouncedSearch.trim();
      fetchLiveProducts({ search: q, limit: 6 })
        .then((data) => {
          if (isCurrent && data?.products) {
            setSearchResults(data.products.slice(0, 6));
            setIsSearchOpen(true);
          }
        })
        .catch(() => {
          if (isCurrent) {
            const results = searchProducts(q).slice(0, 6);
            setSearchResults(results);
            setIsSearchOpen(true);
          }
        });
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch]);

  // Close search and user dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideDesktop = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      const insideMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(e.target);
      if (!insideDesktop && !insideMobile) {
        setIsSearchOpen(false);
      }

      const insideUserDropdown = userDropdownRef.current && userDropdownRef.current.contains(e.target);
      if (!insideUserDropdown) {
        setIsUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserDropdownOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Announcement Bar - Natural document flow, zero sticky layout shifts */}
      <div className="bg-gradient-to-r from-maroon-950 via-maroon-800 to-maroon-950 text-gold-200 w-full max-w-full overflow-hidden text-[11px] sm:text-xs font-medium py-1.5 px-3 sm:px-4 border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="hidden sm:inline-flex items-center gap-1 bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gold-500/30 shrink-0">
              <Sparkles className="w-3 h-3" /> Festive Offer
            </span>
            <span className="truncate min-w-0 text-[10px] sm:text-xs">
              Free Express Shipping on Orders Over ₹999 | Code: <strong className="text-white font-bold underline">FESTIVE20</strong> (20% OFF)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-gold-300/80 shrink-0">
            <Link href="/track-order" className="hover:text-white flex items-center gap-1 transition-colors">
              <Package className="w-3.5 h-3.5" /> Track Order
            </Link>
            <span className="text-gold-500/40">|</span>
            <Link href="/contact" className="hover:text-white flex items-center gap-1 transition-colors">
              <PhoneCall className="w-3 h-3 text-gold-400" /> Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header - Completely stable and flicker-free */}
      <header className={`sticky top-0 z-40 w-full max-w-full transition-shadow duration-200 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        {/* Main Navigation Bar */}
        <div className="relative z-30 bg-white/95 dark:bg-[#140D08]/95 backdrop-blur-md border-b border-gold-500/20 w-full max-w-full overflow-visible py-2 sm:py-2.5 px-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 xs:gap-2 sm:gap-4 w-full min-w-0">
          
          {/* Mobile Menu Toggle & Logo */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-3 min-w-0 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1 xs:p-1.5 sm:p-2 text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 active:scale-90"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <TrioLogo />
          </div>

          {/* Desktop Search Bar with Live Dropdown Floating Above Content */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-xl mx-4 relative z-40 min-w-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search embroidery patches, copper bottles, pooja aasans, gamchas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => debouncedSearch.trim().length > 1 && setIsSearchOpen(true)}
                className="w-full pl-10 pr-24 py-2.5 bg-ivory-100 dark:bg-stone-900/80 text-stone-900 dark:text-ivory-100 text-xs sm:text-sm rounded-full border border-gold-500/30 focus:border-maroon-700 dark:focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold rounded-full transition-colors shadow-xs"
              >
                Search
              </button>
            </form>

            {/* Live Instant Search Dropdown - Directly Below Search Bar & Above Navbar/Content */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2.5 bg-white dark:bg-[#1A110B] rounded-2xl border-2 border-gold-500/40 shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-stone-100 dark:divide-stone-800 max-h-[min(480px,70vh)] overflow-y-auto overscroll-contain">
                <div className="p-3 bg-ivory-100 dark:bg-stone-900/80 flex justify-between items-center text-xs text-stone-500 sticky top-0 z-10 backdrop-blur-md border-b border-gold-500/20">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Product Matches ({searchResults.length})
                  </span>
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="text-maroon-700 dark:text-gold-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    <span>View All Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {searchResults.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3.5 p-3 hover:bg-gold-50/60 dark:hover:bg-stone-800/70 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-gold-500/30">
                      <img
                        src={p.images?.[0] || '/products/shreenathji-statement-patch-1.jpg'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-ivory-100 truncate group-hover:text-maroon-700 dark:group-hover:text-gold-400">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="text-gold-700 dark:text-gold-400 font-semibold">{p.category}</span>
                        <span className="text-stone-300 dark:text-stone-600">•</span>
                        <span className="font-bold text-maroon-800 dark:text-gold-400">₹{p.price?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Utilities (Theme, Wishlist, Cart, Account) */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors active:scale-90"
              aria-label="Toggle dark mode"
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600" />}
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-1.5 sm:p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors active:scale-90"
              aria-label="Wishlist"
              title="My Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-maroon-700 text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon & Trigger */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-maroon-700 to-maroon-900 text-white shadow-maroon-sm hover:from-maroon-600 hover:to-maroon-800 transition-all cursor-pointer shrink-0 active:scale-90"
              aria-label="Open Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gold-300" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gold-500 text-maroon-950 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] text-gold-200/80 uppercase tracking-wider font-bold">Cart</span>
                <span className="text-xs font-bold leading-none">₹{subtotal?.toLocaleString('en-IN')}</span>
              </div>
            </button>

            {/* User Profile Dropdown */}
            <div ref={userDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUserDropdownOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isAuthenticated
                    ? 'border-gold-500/40 bg-gold-500/10 text-maroon-800 dark:text-gold-300'
                    : 'border-stone-200 dark:border-stone-800 hover:border-gold-500 text-stone-700 dark:text-stone-300'
                }`}
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover ring-1 ring-gold-500/50" />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-maroon-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
                {isAuthenticated && user?.name && (
                  <span className="hidden sm:inline text-[11px] font-bold truncate max-w-[80px]">
                    {user.name.split(' ')[0]}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* User Menu Dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1A110B] rounded-2xl border border-gold-500/30 shadow-2xl py-2 z-50 animate-fade-in text-xs">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                        <p className="font-bold text-stone-900 dark:text-ivory-100 truncate">{user.name}</p>
                        <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gold-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
                      >
                        My Account &amp; Addresses
                      </Link>
                      <Link
                        href="/profile/orders"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gold-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
                      >
                        My Orders &amp; Invoices
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gold-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
                      >
                        Saved Wishlist ({wishlistCount})
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-2 text-maroon-600 dark:text-maroon-400 hover:bg-maroon-50 dark:hover:bg-maroon-950/40 font-bold border-t border-stone-100 dark:border-stone-800 mt-1 cursor-pointer transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-stone-500 font-medium">Welcome to Trio Ecart</div>
                      <Link
                        href="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gold-50 dark:hover:bg-stone-800 text-maroon-700 dark:text-gold-400 font-bold transition-colors"
                      >
                        Login / Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gold-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
                      >
                        Create New Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Search Bar Row with Live Dropdown */}
        <div ref={mobileSearchContainerRef} className="md:hidden mt-2.5 pt-2.5 border-t border-gold-500/10 w-full relative z-40">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search patches, copper bottles, pooja items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => debouncedSearch.trim().length > 1 && setIsSearchOpen(true)}
              className="w-full pl-8 pr-16 py-2 bg-ivory-100 dark:bg-stone-900 text-stone-900 dark:text-ivory-100 text-xs rounded-full border border-gold-500/30 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-maroon-700 text-white text-[10px] font-bold rounded-full"
            >
              Search
            </button>
          </form>

          {/* Mobile Instant Search Dropdown Floating Above Content */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#1A110B] rounded-2xl border-2 border-gold-500/40 shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-stone-100 dark:divide-stone-800 max-h-[55vh] overflow-y-auto overscroll-contain">
              <div className="p-2.5 bg-ivory-100 dark:bg-stone-900/80 flex justify-between items-center text-[11px] text-stone-500 sticky top-0 z-10 backdrop-blur-md border-b border-gold-500/20">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  Matches ({searchResults.length})
                </span>
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="text-maroon-700 dark:text-gold-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {searchResults.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-3 p-2.5 hover:bg-gold-50/60 dark:hover:bg-stone-800/70 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-gold-500/30">
                    <img
                      src={p.images?.[0] || '/products/shreenathji-statement-patch-1.jpg'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-ivory-100 truncate">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-gold-700 dark:text-gold-400 font-semibold">{p.category}</span>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <span className="font-bold text-maroon-800 dark:text-gold-400">₹{p.price?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Secondary Category Navigation Links */}
      <nav className="relative z-10 hidden lg:block bg-ivory-200/95 dark:bg-[#1B1109]/95 backdrop-blur-md border-b border-gold-500/20 px-6 py-2 w-full overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-7 text-xs font-semibold">
            
            {/* All Categories Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 py-1 text-maroon-800 dark:text-gold-400 font-bold hover:text-gold-600 transition-colors uppercase tracking-wider"
              >
                <Menu className="w-4 h-4" />
                <span>All Craft Categories</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Mega Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1A110B] rounded-2xl border border-gold-500/30 shadow-2xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 divide-y divide-stone-100 dark:divide-stone-800">
                {categoriesList.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gold-50/70 dark:hover:bg-stone-800 transition-colors"
                  >
                    <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gold-500/30" />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-ivory-100 text-xs">{cat.name}</p>
                      <p className="text-[10px] text-stone-400">{cat.productCount} Products</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/shop" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Explore All Crafts
            </Link>
            <Link href="/category/patches" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Embroidery Patches
            </Link>
            <Link href="/category/bottle" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Pure Copper Bottles
            </Link>
            <Link href="/category/aasan" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Pooja Aasans &amp; Thali
            </Link>
            <Link href="/category/towel-gamcha" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Cotton Gamcha
            </Link>
            <Link href="/category/cup-chain" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Cup Chains &amp; Lace
            </Link>
            <Link href="/blog" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Craft Journal
            </Link>
            <Link href="/contact" className="text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
              Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-maroon-700 dark:text-gold-400">
            <span className="flex items-center gap-1.5 bg-maroon-100 dark:bg-maroon-950/60 text-maroon-900 dark:text-gold-300 px-3 py-1 rounded-full border border-maroon-300 dark:border-gold-500/30">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" /> 100% Genuine Handcrafted
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-sm bg-white dark:bg-[#1A110B] h-[100dvh] max-h-screen overflow-y-auto overscroll-contain p-6 pb-32 sm:pb-28 shadow-2xl animate-fade-in flex flex-col justify-between gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
                <TrioLogo />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-maroon-700 dark:hover:text-gold-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2 text-sm font-semibold">
                <Link href="/" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  Home
                </Link>
                <Link href="/shop" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  All Products
                </Link>
                
                {/* Categories List */}
                <div className="py-2">
                  <span className="text-xs uppercase font-bold text-gold-700 dark:text-gold-400 tracking-wider">
                    Categories
                  </span>
                  <div className="pl-3 mt-2 space-y-2 text-xs text-stone-600 dark:text-stone-300 border-l border-gold-500/30">
                    {categoriesList.map(c => (
                      <Link key={c.id} href={`/category/${c.slug}`} className="block py-1 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link href="/blog" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  Craft Journal &amp; Guides
                </Link>
                <Link href="/track-order" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  Track Order
                </Link>
                <Link href="/about" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  About Our Artisan Guild
                </Link>
                <Link href="/contact" className="block py-2 text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Mobile Footer Auth Section */}
            <div className="pt-6 border-t border-gold-500/20 shrink-0 mt-auto">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gold-500" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-maroon-700 text-white flex items-center justify-center font-bold text-sm border border-gold-500 shadow-xs">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-stone-900 dark:text-ivory-100 truncate">{user?.name || 'Artisan Patron'}</p>
                      <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-2 text-center btn-primary text-xs font-bold"
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await logout();
                      }}
                      className="block w-full py-2 text-center btn-outline-maroon text-xs font-bold cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 text-center btn-primary text-xs font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 text-center btn-outline-maroon text-xs font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  </>
  );
};

export default Navbar;
