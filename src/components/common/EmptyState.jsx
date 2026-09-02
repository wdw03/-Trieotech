import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = ShoppingBag,
  title = "No items found",
  description = "Explore our handcrafted ethnic collection to find something beautiful.",
  actionText = "Explore Collection",
  actionUrl = "/shop",
  onAction = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 ethnic-card max-w-lg mx-auto">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gold-500/10 dark:bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-600 dark:text-gold-400 mb-5 shadow-inner">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100 mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {onAction ? (
        <button
          onClick={onAction}
          className="btn-primary text-xs sm:text-sm font-bold uppercase tracking-wider"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : actionUrl ? (
        <Link
          to={actionUrl}
          className="btn-primary text-xs sm:text-sm font-bold uppercase tracking-wider"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
};

export default EmptyState;
