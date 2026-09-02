import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const MobileNav = () => {
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#140D08]/95 backdrop-blur-md border-t border-gold-500/30 py-2 px-3 shadow-2xl">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        {/* Shop / Explore */}
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </NavLink>

        {/* Search */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>

        {/* Wishlist */}
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-maroon-700 text-white text-[9px] font-extrabold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span>Wishlist</span>
        </NavLink>

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
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-bold ${
              isActive ? 'text-maroon-700 dark:text-gold-400' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default MobileNav;
