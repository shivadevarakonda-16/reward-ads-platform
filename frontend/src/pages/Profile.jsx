import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../api/client';
import {
  User as UserIcon,
  Mail,
  Phone,
  Share2,
  Copy,
  Check,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  Edit2,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await userApi.updateProfile({ name, phone });
      if (res.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
        Account Profile
      </h1>

      {/* Main Profile Info Card */}
      <div className="p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-oxygen-darkSubtle flex items-center justify-center font-bold text-2xl text-slate-700 dark:text-slate-200 overflow-hidden ring-4 ring-slate-100 dark:ring-oxygen-darkBorder">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0]?.toUpperCase() || <UserIcon className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {user.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <span className="text-[11px] text-oxygen-red font-semibold mt-1 inline-block">
                Role: {user.role === 'admin' ? 'Platform Administrator' : 'Verified Member'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Profile Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.email}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.phone || 'Not linked'}</p>
            </div>
          </div>
        )}

        {/* Member Referral Code Card */}
        <div className="p-5 rounded-3xl bg-oxygen-red/5 border border-oxygen-red/20 space-y-2">
          <span className="text-[10px] uppercase font-bold text-oxygen-red">Your User Referral Code</span>
          <div className="flex items-center space-x-3">
            <span className="text-xl font-mono font-extrabold tracking-wider text-slate-900 dark:text-white">
              {user.referralCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded-xl bg-white dark:bg-oxygen-darkCard text-xs font-semibold shadow-sm flex items-center space-x-1 border border-oxygen-lightBorder dark:border-oxygen-darkBorder"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Give this code to friends during signup to link their accounts and earn referral rewards.
          </p>
        </div>

        {/* Preferences & Logout */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder">
            <div className="flex items-center space-x-3">
              {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Appearance Theme</h4>
                <p className="text-[10px] text-slate-400">Switch between OxygenOS Light and True Dark surfaces</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-1.5 rounded-full bg-slate-200 dark:bg-oxygen-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
