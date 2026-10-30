import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignApi, dealApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/SkeletonLoader';
import { CountUp } from '../components/CountUp';
import {
  PlaySquare,
  Sparkles,
  ArrowRight,
  Share2,
  Tag,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Food & Beverage',
  'Beauty',
  'Fitness',
  'Travel',
  'Home',
  'Books'
];

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [campaigns, setCampaigns] = useState([]);
  const [trendingDeals, setTrendingDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [campRes, dealRes] = await Promise.all([
          campaignApi.getCampaigns({
            status: 'active',
            category: selectedCategory === 'All' ? undefined : selectedCategory,
            limit: 8
          }),
          dealApi.getDeals({ status: 'active', limit: 4 })
        ]);

        if (campRes.success) setCampaigns(campRes.data);
        if (dealRes.success) setTrendingDeals(dealRes.data);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [selectedCategory]);

  return (
    <div className="space-y-8 pb-16">
      {/* HERO BANNER - OxygenOS styled */}
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6 sm:p-10 shadow-soft-dark border border-white/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-oxygen-red" />
            <span>Simulated Rewards Engine • Zero Real Money</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Watch reels. Discover brands.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-oxygen-red to-orange-400">
              Earn rewards.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Experience our short-video ads platform. Watch sponsored reels to 90% completion, promote products, and unlock deals.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/watch"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-sm font-bold shadow-lg shadow-oxygen-red/40 transition-all hover:scale-102"
            >
              <PlaySquare className="w-4 h-4" />
              <span>Start Watching Feed</span>
            </Link>

            <Link
              to="/promote"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm font-semibold border border-white/10 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Promote Products</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-oxygen-red/20 blur-3xl pointer-events-none" />
      </section>

      {/* QUICK STATUS CHIP IF LOGGED IN */}
      {isAuthenticated && (
        <section className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-oxygen-red/10 dark:bg-oxygen-red/20 flex items-center justify-center text-oxygen-red font-bold text-lg">
              ₹
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, {user?.name}</p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Wallet Balance: <CountUp end={user?.walletBalance || 0} />
              </h2>
            </div>
          </div>

          <Link
            to="/wallet"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold text-oxygen-red bg-oxygen-red/10 hover:bg-oxygen-red/20 transition-all"
          >
            <span>View Wallet History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}

      {/* CATEGORY FILTER CHIPS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Explore Categories</h2>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-white dark:bg-oxygen-darkCard text-slate-600 dark:text-slate-400 border border-oxygen-lightBorder dark:border-oxygen-darkBorder hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* FEATURED CAMPAIGNS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Featured Campaigns</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Watch video ads or complete promotional activities to earn rewards
            </p>
          </div>
          <Link
            to="/watch"
            className="text-xs font-bold text-oxygen-red hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-oxygen-darkCard rounded-3xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-500">
            No campaigns available in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {campaigns.map((camp) => (
              <motion.div
                key={camp._id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder p-4 shadow-soft overflow-hidden"
              >
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-slate-900">
                    <img
                      src={camp.thumbnailUrl || camp.productId?.images?.[0] || 'https://picsum.photos/400/250'}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      {camp.type.replace('_', ' ')}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-oxygen-red text-white text-xs font-extrabold shadow-md">
                      +₹{camp.rewardAmount}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-1.5">
                    {camp.sponsorId?.logoUrl && (
                      <img
                        src={camp.sponsorId.logoUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {camp.sponsorId?.brandName}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2">
                    {camp.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Budget Remaining</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ₹{Math.max(0, camp.totalBudget - camp.spentBudget).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    to={camp.type === 'AD_VIEW' ? '/watch' : `/campaigns/${camp._id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-oxygen-darkSubtle hover:bg-oxygen-red hover:text-white transition-all text-slate-800 dark:text-slate-200"
                  >
                    {camp.type === 'AD_VIEW' ? 'Watch Now' : 'Participate'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* TRENDING DEALS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-oxygen-red" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Trending Deals & Coupons</h2>
          </div>
          <Link
            to="/deals"
            className="text-xs font-bold text-oxygen-red hover:underline flex items-center space-x-1"
          >
            <span>See All Deals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingDeals.map((deal) => (
            <div
              key={deal._id}
              className="p-4 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-oxygen-red uppercase tracking-wider">
                    {deal.sponsorId?.brandName || 'Sponsor'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    {deal.discountType === 'percent' ? `${deal.discountValue}% OFF` : `₹${deal.discountValue} OFF`}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
                  {deal.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Min spend: ₹{deal.minPurchase}. Single use.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-xl bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-800 dark:text-slate-200">
                  {deal.code}
                </span>
                <Link
                  to="/deals"
                  className="text-xs font-bold text-oxygen-red hover:underline"
                >
                  Redeem
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM ASSURANCE BANNER */}
      <section className="p-6 rounded-3xl bg-slate-100 dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-8 h-8 text-oxygen-red shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Transparent Campaign Funding & Verification
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rewards are simulated prototype credits backed strictly by verified sponsor budgets. Never unlimited or guaranteed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
