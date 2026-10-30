import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected rewards for bulk action
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkDecision, setBulkDecision] = useState('approved');
  const [bulkReason, setBulkReason] = useState('Batch verified by administrator');
  const [processing, setProcessing] = useState(false);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRewards({
        status: statusFilter || undefined,
        sourceType: typeFilter || undefined,
        page,
        limit: 25
      });
      if (res.success) {
        setRewards(res.data);
        setTotalPages(res.pagination.pages);
        setSelectedIds([]);
      }
    } catch (err) {
      toast.error('Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [statusFilter, typeFilter, page]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rewards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rewards.map(r => r._id));
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkReason.trim()) {
      toast.error('A decision reason is mandatory.');
      return;
    }

    try {
      setProcessing(true);
      const res = await adminApi.bulkDecideRewards({
        rewardIds: selectedIds,
        decision: bulkDecision,
        reason: bulkReason.trim()
      });

      if (res.success) {
        toast.success(res.message);
        setBulkModal(false);
        fetchRewards();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to execute bulk decision.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleDecide = async (id, decision, defaultReason) => {
    const reason = window.prompt(`Enter decision reason for marking as ${decision}:`, defaultReason);
    if (!reason || !reason.trim()) return;

    try {
      const res = await adminApi.decideReward(id, { decision, reason: reason.trim() });
      if (res.success) {
        toast.success(`Reward marked as ${decision}`);
        fetchRewards();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to update reward.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Reward Ledger & Decisions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review reward claims across ad views, promotional activities, and referrals.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={() => setBulkModal(true)}
            className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Bulk Decide ({selectedIds.length} Selected)</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-2">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: '', label: 'All Statuses' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-oxygen-darkCard text-slate-600 dark:text-slate-400 border border-oxygen-lightBorder dark:border-oxygen-darkBorder'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Source Types</option>
          <option value="AD_VIEW">AD_VIEW</option>
          <option value="PROMOTE">PROMOTE</option>
          <option value="REFERRAL">REFERRAL</option>
          <option value="DEAL">DEAL</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-400 uppercase font-semibold bg-slate-50 dark:bg-oxygen-darkSubtle/30">
                <th className="py-3.5 px-4 w-10">
                  <button onClick={toggleSelectAll} className="p-1">
                    {selectedIds.length > 0 && selectedIds.length === rewards.length ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Campaign & Sponsor</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reason / Decided By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading rewards...</td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No rewards found.</td>
                </tr>
              ) : (
                rewards.map((r) => {
                  const isSelected = selectedIds.includes(r._id);
                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-slate-50 dark:hover:bg-oxygen-darkSubtle/30 ${
                        isSelected ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <button onClick={() => toggleSelect(r._id)} className="p-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {r.userId?.name || 'User'}
                        <span className="block text-[10px] text-slate-400 font-normal">{r.userId?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {r.campaignId?.title || 'Campaign'}
                        <span className="block text-[10px] text-purple-600 dark:text-purple-400">
                          {r.campaignId?.sponsorId?.brandName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-400">
                          {r.sourceType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-sm text-slate-900 dark:text-white">
                        ₹{r.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            r.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : r.status === 'rejected'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {r.reason || 'Pending verification'}
                        {r.decidedBy && (
                          <span className="block text-[10px] text-slate-400">
                            By: {r.decidedBy.name || 'Admin'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {r.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleSingleDecide(r._id, 'approved', 'Verified by administrator')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[11px] font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleSingleDecide(r._id, 'rejected', 'Did not meet criteria')}
                              className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 text-[11px] font-bold"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Decision Modal */}
      <AnimatePresence>
        {bulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Bulk Process Rewards
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are making a batch decision on {selectedIds.length} rewards.
                </p>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Action *
                  </label>
                  <select
                    value={bulkDecision}
                    onChange={(e) => setBulkDecision(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white"
                  >
                    <option value="approved">Bulk Approve</option>
                    <option value="rejected">Bulk Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Decision Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
                  >
                    {processing ? 'Applying...' : `Execute Bulk ${bulkDecision}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkModal(false)}
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
