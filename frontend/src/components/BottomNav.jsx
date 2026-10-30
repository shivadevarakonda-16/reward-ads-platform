import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Tag, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/watch', label: 'Watch', icon: PlaySquare, highlight: true },
  { path: '/deals', label: 'Deals', icon: Tag },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/profile', label: 'Profile', icon: User }
];

export const BottomNav = () => {
  const location = useLocation();

  // If in reels full-screen mode, render compact floating glass bottom bar
  const isWatch = location.pathname === '/watch';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none">
      <div className={`pointer-events-auto mx-auto max-w-md rounded-full shadow-2xl transition-all duration-300 ${
        isWatch
          ? 'glass-panel text-white'
          : 'bg-white/95 dark:bg-oxygen-darkCard/95 backdrop-blur-xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-700 dark:text-slate-300'
      }`}>
        <ul className="flex items-center justify-around h-16 px-2 relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className="relative flex flex-col items-center justify-center w-full py-1 text-xs transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeBottomNavPill"
                      className="absolute inset-x-2 inset-y-0.5 rounded-full bg-oxygen-red/10 dark:bg-oxygen-red/20 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110 text-oxygen-red' : 'opacity-70'}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  <span className={`text-[10px] tracking-tight font-medium ${isActive ? 'text-oxygen-red font-bold' : 'opacity-70'}`}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
