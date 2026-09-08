export const metadata = {
  title: 'Terms of Service & Patron Agreement | Trio Enterprises',
  description: 'Review the terms of purchase, authentic craft warranties, and conditions governing the Trio Enterprises online portal.',
  alternates: {
    canonical: '/terms',
  },
};

import React from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            <Breadcrumb items={[{ name: 'Terms of Service', url: '/terms' }]} />

      <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
        Terms of Service
      </h1>

      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        <p>
          By accessing and placing orders on <strong>Trio Ecart</strong>, you agree to our terms of handcrafted authentic goods and services under Indian jurisdiction.
        </p>
        <p>
          Since every item is hand-embroidered, hand-hammered, or hand-assembled, minor organic variations in thread sheen, stone alignment, or copper patina are natural hallmarks of authentic Indian karigari.
        </p>
      </div>
    </div>
  );
};



