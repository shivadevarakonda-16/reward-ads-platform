import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  AlertCircle,
  Eye,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Decision Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Evidence preview modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getActivities({ status: statusFilter || undefined, page, limit: 15 });
      if (res.success) {
        setActivities(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load activities queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [statusFilter, page]);

  const openDecisionModal = (activity, dec) => {
    setSelectedActivity(activity);
    setDecision(dec);
    setReason(
      dec === 'approved'
        ? 'Verified promotional evidence meets campaign engagement standards.'
        : 'Ineligible evidence: Missing visible campaign link or promotional context.'
    );
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('A decision reason is mandatory.');
      return;
    }

    try {
      setProcessing(true);
      const res = await adminApi.decideActivity(selectedActivity._id, {
        decision,
        reason: reason.trim()
      });

      if (res.success) {
        toast.success(`Activity successfully marked as ${decision}!`);
        setSelectedActivity(null);
        fetchActivities();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to submit decision.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Activity Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review user-submitted promotional proofs. Approvals atomically credit user wallets and log audit trails.
          </p>
        </div>

        {/* Filter status tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'submitted', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: '', label: 'All' }
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
                  : 'bg-white dark:bg-oxygen-darkCard text-slate-600 dark:text-slate-400 border border-oxygen-lightBorder dark:border-oxygen-darkBorder hover:border-purple-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading queue items...</div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-500">
          No activities found in this state.
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const user = act.userId;
            const campaign = act.campaignId;
            const link = act.referralLinkId;

            return (
              <div
                key={act._id}
                className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Campaign & User details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {act.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {campaign?.title}
                    </span>
                    <span className="text-xs font-extrabold text-oxygen-red">
                      (Reward: ₹{campaign?.rewardAmount})
                    </span>
                  </div>

                  {/* Evidence Text */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-oxygen-darkSubtle/50 p-3 rounded-2xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder leading-relaxed">
                    <strong>Evidence Description:</strong> {act.evidenceText || 'No textual proof submitted.'}
                  </p>

                  {/* User Profile & Referral Meta */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
                    <span>
                      User: <strong className="text-slate-900 dark:text-white">{user?.name}</strong> ({user?.email})
                    </span>
                    <span>
                      Balance: <strong>₹{user?.walletBalance || 0}</strong>
                    </span>
                    {link && (
                      <span>
                        Referral Stats: <strong>{link.clicks}</strong> clicks, <strong>{link.uniqueVisits}</strong> unique
                      </span>
                    )}
                    <span>Submitted: {new Date(act.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Decision note if already decided */}
                  {act.decisionReason && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      <strong>Admin note:</strong> {act.decisionReason}
                    </div>
                  )}
                </div>

                {/* Right: Evidence Preview & Actions */}
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 shrink-0">
                  {act.evidenceUrl && (
                    <button
                      onClick={() => setPreviewImage(act.evidenceUrl)}
                      className="w-20 h-20 rounded-2xl overflow-hidden border border-oxygen-lightBorder dark:border-oxygen-darkBorder relative group cursor-pointer"
                    >
                      <img src={act.evidenceUrl} alt="Proof" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                        <Eye className="w-5 h-5" />
                      </div>
                    </button>
                  )}

                  {act.status === 'submitted' ? (
                    <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-auto">
                      <button
                        onClick={() => openDecisionModal(act, 'approved')}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openDecisionModal(act, 'rejected')}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold capitalize flex items-center space-x-1 ${
                        act.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {act.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>{act.status}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Required Reason Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-5"
            >
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    decision === 'approved' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {decision === 'approved' ? 'Approve Activity & Reward' : 'Reject Activity Submission'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Required Decision Reason
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every decision requires an explicit reason written into the audit log and user notification.
                </p>
              </div>

              <form onSubmit={handleDecisionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Decision Note / Reason *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for audit record..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] leading-relaxed">
                  {decision === 'approved'
                    ? `Approving will credit ₹${selectedActivity.campaignId?.rewardAmount} to ${selectedActivity.userId?.name}'s wallet and increment campaign spent budget.`
                    : `Rejecting will notify ${selectedActivity.userId?.name} and deduct from pending balance without changing wallet balance.`}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className={`flex-1 py-3 rounded-full text-white text-xs font-bold transition-all shadow-md ${
                      decision === 'approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {processing ? 'Processing...' : `Confirm ${decision.toUpperCase()}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
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

      {/* Image Evidence Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={previewImage}
              alt="Screenshot Preview"
              className="max-w-2xl max-h-[85vh] rounded-3xl object-contain shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
