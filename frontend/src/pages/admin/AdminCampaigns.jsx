import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  StopCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    sponsorId: '',
    productId: '',
    title: '',
    description: '',
    type: 'AD_VIEW',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    durationSec: 15,
    rewardAmount: 5,
    totalBudget: 25000,
    maxParticipantsPerUser: 1,
    status: 'active',
    autoApprove: true,
    requirementsText: 'Watch at least 90% of the video ad without skipping',
    evidenceType: 'none'
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCampaigns({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        limit: 50
      });
      if (res.success) setCampaigns(res.data);
    } catch (err) {
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        adminApi.getSponsors({ limit: 100 }),
        adminApi.getProducts({ limit: 100 })
      ]);
      if (sRes.success) {
        setSponsors(sRes.data);
        if (sRes.data.length > 0) {
          setFormData(prev => ({ ...prev, sponsorId: sRes.data[0]._id }));
        }
      }
      if (pRes.success) setProducts(pRes.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchCampaigns();
    fetchDropdowns();
  }, [typeFilter, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.totalBudget) < parseFloat(formData.rewardAmount)) {
      toast.error('Total budget must be at least equal to one reward amount.');
      return;
    }

    try {
      const payload = {
        ...formData,
        requirements: {
          text: formData.requirementsText,
          evidenceType: formData.evidenceType
        }
      };

      const res = await adminApi.createCampaign(payload);
      if (res.success) {
        toast.success('Campaign created successfully!');
        setShowCreateModal(false);
        fetchCampaigns();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to create campaign.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminApi.updateCampaignStatus(id, newStatus);
      if (res.success) {
        toast.success(`Campaign marked as ${newStatus}`);
        fetchCampaigns();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to update campaign status.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Campaigns Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define promotional formats, reward bounties, and monitor budget spend.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="AD_VIEW">AD_VIEW (Reels)</option>
          <option value="PROMOTE">PROMOTE (Social)</option>
          <option value="REFERRAL">REFERRAL (Links)</option>
          <option value="DEAL">DEAL (Vouchers)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Campaigns Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading campaigns...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const remaining = Math.max(0, camp.totalBudget - camp.spentBudget);
            const spentPercent = Math.min(100, (camp.spentBudget / camp.totalBudget) * 100);

            return (
              <div
                key={camp._id}
                className="p-5 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
                      {camp.type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        camp.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : camp.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {camp.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {camp.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Sponsor: <strong>{camp.sponsorId?.brandName}</strong>
                  </span>
                </div>

                {/* Budget meter */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Spent Budget</span>
                    <span className="text-slate-900 dark:text-white">
                      ₹{camp.spentBudget?.toLocaleString('en-IN')} / ₹{camp.totalBudget?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Reward: ₹{camp.rewardAmount}</span>
                    <span>Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
                  {camp.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(camp._id, 'paused')}
                      className="flex-1 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center space-x-1"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(camp._id, 'active')}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusChange(camp._id, 'ended')}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-500 hover:text-red-500 text-xs font-semibold"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Create New Campaign
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add video ad view or promotional campaign with funded budget.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Sponsor Partner *
                  </label>
                  <select
                    value={formData.sponsorId}
                    onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  >
                    {sponsors.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.brandName} ({s.category}) — Budget: ₹{s.totalBudget}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. boAt Wave Call 2 - Watch & Win"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Campaign Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    >
                      <option value="AD_VIEW">AD_VIEW (Reels Feed)</option>
                      <option value="PROMOTE">PROMOTE (Social Sharing)</option>
                      <option value="REFERRAL">REFERRAL (Referral Links)</option>
                      <option value="DEAL">DEAL (Product Deals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Reward Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.rewardAmount}
                      onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Total Campaign Budget (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={formData.rewardAmount}
                      value={formData.totalBudget}
                      onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.durationSec}
                      onChange={(e) => setFormData({ ...formData, durationSec: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Video MP4 URL (for AD_VIEW)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Thumbnail Poster URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Requirements Instructions
                  </label>
                  <input
                    type="text"
                    value={formData.requirementsText}
                    onChange={(e) => setFormData({ ...formData, requirementsText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
                  >
                    Create Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
