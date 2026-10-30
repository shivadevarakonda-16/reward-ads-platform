import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationApi } from '../api/client';
import { Bell, Moon, Sun, Wallet, Shield, CheckCheck, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const res = await notificationApi.getAll();
        if (res.success) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-oxygen-lightBg/80 dark:bg-oxygen-darkBg/80 backdrop-blur-xl border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-2xl bg-oxygen-red flex items-center justify-center text-white font-extrabold text-lg shadow-glow-red transition-transform group-hover:scale-105">
            R
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Reward<span className="text-oxygen-red">Ads</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-200 dark:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-400">
            Beta
          </span>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin shortcut if admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* Wallet summary chip */}
          {isAuthenticated && (
            <Link
              to="/wallet"
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-oxygen-lightCard dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-sm hover:border-oxygen-red/50 transition-all"
            >
              <Wallet className="w-4 h-4 text-oxygen-red" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">Wallet</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  ₹{user?.walletBalance ?? 0}
                </span>
              </div>
            </Link>
          )}

          {/* Notifications bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-oxygen-darkCard text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-oxygen-red ring-2 ring-white dark:ring-oxygen-darkBg" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl p-4 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-oxygen-red/10 text-oxygen-red text-xs font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-slate-500 hover:text-oxygen-red flex items-center space-x-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 rounded-2xl transition-colors text-xs ${
                              n.read
                                ? 'bg-slate-50 dark:bg-oxygen-darkSubtle/40 text-slate-600 dark:text-slate-400'
                                : 'bg-oxygen-red/5 dark:bg-oxygen-red/10 text-slate-800 dark:text-slate-200 border-l-2 border-oxygen-red'
                            }`}
                          >
                            <p className="font-semibold text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                            <p className="line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-oxygen-darkCard text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile / Auth */}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-oxygen-darkSubtle flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 overflow-hidden ring-2 ring-transparent hover:ring-oxygen-red/50 transition-all"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />
              )}
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-oxygen-darkCard transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-oxygen-red text-white hover:bg-oxygen-redHover shadow-sm shadow-oxygen-red/30 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
