import React, { useState, useEffect } from 'react';
import { dealApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Tag, Clock, Check, Copy, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Deals = () => {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockedDeal, setUnlockedDeal] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await dealApi.getDeals({ limit: 40 });
        if (res.success) {
          setDeals(res.data);
        }
      } catch (err) {
        toast.error('Failed to load deals.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleRedeem = async (deal) => {
    if (deal.isExpired) {
      toast.error('This deal has expired and cannot be redeemed.');
      return;
    }

    if (!isAuthenticated) {
      toast('Please log in to redeem this deal.');
      return;
    }

    try {
      const res = await dealApi.redeem(deal._id);
      if (res.success) {
        setUnlockedDeal({ ...deal, revealedCode: res.code });
        toast.success('Deal code unlocked!');
        // Update deal in local state
        setDeals(prev =>
          prev.map(d => (d._id === deal._id ? { ...d, hasRedeemed: true, revealedCode: res.code } : d))
        );
      }
    } catch (err) {
      toast.error(err.error || 'Failed to redeem deal.');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Exclusive Sponsor Deals & Coupons
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unlock verified discount vouchers sponsored by top Indian brands. Simulated redemption.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-56 rounded-3xl bg-slate-200 dark:bg-oxygen-darkCard animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => {
            const isExpired = deal.isExpired;
            return (
              <motion.div
                key={deal._id}
                whileHover={!isExpired ? { y: -3 } : {}}
                className={`flex flex-col justify-between p-6 rounded-4xl border transition-all ${
                  isExpired
                    ? 'bg-slate-100/70 dark:bg-oxygen-darkCard/40 border-slate-300 dark:border-oxygen-darkBorder opacity-60 grayscale'
                    : 'bg-white dark:bg-oxygen-darkCard border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft'
                }`}
              >
                <div>
                  {/* Top metadata */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {deal.sponsorId?.brandName}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isExpired
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpired
                        ? 'EXPIRED'
                        : deal.discountType === 'percent'
                        ? `${deal.discountValue}% OFF`
                        : `₹${deal.discountValue} OFF`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {deal.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {deal.restrictions}
                  </p>

                  {deal.originalPrice && (
                    <div className="flex items-baseline space-x-2 text-xs text-slate-500 mb-2">
                      <span>Original price: ₹{deal.originalPrice}</span>
                      <span>• Min spend: ₹{deal.minPurchase}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
                  <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires: {new Date(deal.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {deal.hasRedeemed ? (
                    <div className="flex items-center space-x-2">
                      <span className="flex-1 py-2 px-3 rounded-2xl bg-slate-100 dark:bg-oxygen-darkSubtle font-mono text-center text-xs font-bold text-slate-900 dark:text-white border border-oxygen-lightBorder dark:border-oxygen-darkBorder">
                        {deal.revealedCode}
                      </span>
                      <button
                        onClick={() => copyCode(deal.revealedCode)}
                        className="p-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRedeem(deal)}
                      disabled={isExpired}
                      className={`w-full py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                        isExpired
                          ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-oxygen-red hover:bg-oxygen-redHover text-white shadow-oxygen-red/30'
                      }`}
                    >
                      {isExpired ? 'Deal Expired' : 'Reveal Voucher Code'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unlocked Deal Modal */}
      <AnimatePresence>
        {unlockedDeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-oxygen-red">
                  {unlockedDeal.sponsorId?.brandName}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {unlockedDeal.title}
                </h3>
              </div>

              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Your Voucher Code</span>
                <div className="text-2xl font-mono font-extrabold tracking-widest text-slate-900 dark:text-white select-all">
                  {unlockedDeal.revealedCode}
                </div>
                <button
                  onClick={() => copyCode(unlockedDeal.revealedCode)}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Apply this code at partner checkout. Simulated voucher prototype.
              </p>

              <button
                onClick={() => setUnlockedDeal(null)}
                className="w-full py-3 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
