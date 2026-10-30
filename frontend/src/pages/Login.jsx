import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-3xl bg-oxygen-red text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-glow-red">
            R
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign In to RewardAds
          </h1>
          <p className="text-xs text-slate-500">
            Access your reels feed, promotional tasks, and rewards wallet.
          </p>
        </div>

        <div className="p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-oxygen-red hover:bg-oxygen-redHover disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-oxygen-red/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-fill Demo Credentials */}
          <div className="space-y-2 pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Quick Fill Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@rewardads.test', 'Admin@12345')}
                className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-500/20 text-left transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <strong>Admin User</strong>
                </div>
                <span className="text-[9px] block text-purple-400 opacity-80">Full administrative role</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('aarav.sharma1@rewardads.test', 'User@12345')}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 text-left transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <strong>Demo User 1</strong>
                </div>
                <span className="text-[9px] block text-slate-400">Aarav Sharma</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-oxygen-red font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
