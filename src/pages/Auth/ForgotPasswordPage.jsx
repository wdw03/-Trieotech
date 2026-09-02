import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import TrioLogo from '../../components/common/TrioLogo';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      addToast('Password reset link sent to your email', 'success');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <SEO title="Forgot Password | Trio Ecart" />

      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 text-center">
        <TrioLogo className="justify-center" />

        {submitted ? (
          <div className="space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-ivory-100">
              Check Your Inbox
            </h2>
            <p className="text-xs text-stone-500">
              We've dispatched a secure recovery link to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100">
                Reset Password
              </h1>
              <p className="text-xs text-stone-500">
                Enter your registered patron email to receive a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Registered Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. radhika@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700"
                  />
                  <Mail className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-xs text-stone-500">
              <Link to="/login" className="font-bold text-maroon-700 dark:text-gold-400 hover:underline">
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
