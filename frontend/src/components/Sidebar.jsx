import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlaySquare, Tag, Wallet, Share2, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adViewApi } from '../api/client';

const DESKTOP_NAV = [
  { path: '/', label: 'Home / Discover', icon: Home },
  { path: '/watch', label: 'Watch & Earn', icon: PlaySquare, badge: 'Hot' },
  { path: '/deals', label: 'Deals & Coupons', icon: Tag },
  { path: '/promote', label: 'Promote & Refer', icon: Share2 },
  { path: '/wallet', label: 'Rewards Wallet', icon: Wallet },
  { path: '/profile', label: 'My Profile', icon: User }
];

export const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const [dailyStats, setDailyStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadDaily = async () => {
      try {
        const res = await adViewApi.getDailyStats();
        if (res.success) setDailyStats(res);
      } catch (err) {}
    };
    loadDaily();
  }, [isAuthenticated]);

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 p-4 border-r border-oxygen-lightBorder dark:border-oxygen-darkBorder overflow-y-auto">
      {/* Navigation links */}
      <nav className="space-y-1.5 flex-1">
        {DESKTOP_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-oxygen-red text-white shadow-sm shadow-oxygen-red/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-oxygen-darkCard hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Daily Stats Card */}
      {isAuthenticated && dailyStats && (
        <div className="mt-4 p-4 rounded-3xl bg-oxygen-lightCard dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <Sparkles className="w-4 h-4 text-oxygen-red" />
            <span>Daily Watch Allowance</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {dailyStats.todayAdsWatched}
              </span>
              <span className="text-xs text-slate-400"> / {dailyStats.maxAdsPerDay} ads</span>
            </div>
            <span className="text-sm font-bold text-emerald-500">+₹{dailyStats.todayEarned}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-oxygen-darkSubtle rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-oxygen-red h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (dailyStats.todayAdsWatched / dailyStats.maxAdsPerDay) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Prototype Simulated Note */}
      <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
        <strong>Simulated Prototype:</strong> Rewards and campaigns are simulated demonstration values funded strictly from campaign budgets.
      </div>
    </aside>
  );
};
