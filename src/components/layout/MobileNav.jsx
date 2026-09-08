'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const MobileNavLink = ({ href, children, exact = false }) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
        isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
      }`}
    >
      {children}
    </Link>
  );
};

export const MobileNav = () => {
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#140D08]/95 backdrop-blur-md border-t border-gold-500/30 py-2 px-3 shadow-2xl">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <MobileNavLink href="/" exact>
          <Home className="w-5 h-5" />
          <span>Home</span>
        </MobileNavLink>

        {/* Shop / Explore */}
        <MobileNavLink href="/shop">
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </MobileNavLink>

        {/* Search */}
        <MobileNavLink href="/search">
          <Search className="w-5 h-5" />
          <span>Search</span>
        </MobileNavLink>

        {/* Wishlist */}
        <MobileNavLink href="/wishlist">
          <div className="relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-maroon-700 text-white text-[9px] font-extrabold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span>Wishlist</span>
        </MobileNavLink>

        {/* Cart Trigger */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center gap-1 text-[10px] font-bold text-stone-500 dark:text-stone-400"
          aria-label="Open cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-maroon-700 dark:text-gold-400" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-gold-500 text-maroon-950 text-[9px] font-black flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* Profile */}
        <MobileNavLink href="/profile">
          <User className="w-5 h-5" />
          <span>Account</span>
        </MobileNavLink>

      </div>
    </nav>
  );
};

export default MobileNav;
