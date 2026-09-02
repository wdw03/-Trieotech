import React from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';

export const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Privacy Policy | Trio Ecart" />
      <Breadcrumb items={[{ name: 'Privacy Policy', url: '/privacy' }]} />

      <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
        Privacy &amp; Data Protection Policy
      </h1>

      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        <p>
          At <strong>Trio Ecart</strong>, we value your sacred privacy. We only collect essential customer data (Name, Phone, Shipping Address, Email) necessary to process orders, generate tracking updates, and provide patron support.
        </p>
        <p>
          We never sell, rent, or trade your personal information with third-party advertising networks. Payment data is encrypted securely via certified payment gateways.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
