import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignApi, referralApi, activityApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Share2,
  Copy,
  Check,
  UploadCloud,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Promote = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(location.state?.selectedCampaignId || '');
  const [referralLink, setReferralLink] = useState(null);
  const [myActivities, setMyActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceText, setEvidenceText] = useState('');

  // Load promote campaigns and user's prior activities
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          campaignApi.getCampaigns({ type: 'PROMOTE', status: 'active', limit: 20 }),
          isAuthenticated ? activityApi.getMine() : Promise.resolve({ data: [] })
        ]);

        if (cRes.success) {
          setCampaigns(cRes.data);
          if (!selectedCampaignId && cRes.data.length > 0) {
            setSelectedCampaignId(cRes.data[0]._id);
          }
        }
        if (aRes.success) {
          setMyActivities(aRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, selectedCampaignId]);

  // When selected campaign changes, fetch or generate referral link
  useEffect(() => {
    if (!selectedCampaignId || !isAuthenticated) return;

    referralApi
      .generate({ campaignId: selectedCampaignId })
      .then((res) => {
        if (res.success) setReferralLink(res.data);
      })
      .catch((err) => console.warn(err));
  }, [selectedCampaignId, isAuthenticated]);

  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Promote & Earn',
          text: 'Check out this sponsored promotion!',
          url: referralLink.url
        });
      } catch (e) {}
    } else {
      copyLink(referralLink.url);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to submit promotional proof.');
      return;
    }

    if (!evidenceUrl.trim() && !evidenceText.trim()) {
      toast.error('Please provide an image screenshot URL or text evidence.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await activityApi.submit({
        campaignId: selectedCampaignId,
        type: 'PROMOTE',
        evidenceUrl: evidenceUrl.trim(),
        evidenceText: evidenceText.trim(),
        referralLinkId: referralLink?._id
      });

      if (res.success) {
        toast.success('Proof submitted! Sent to admin queue for verification.');
        setEvidenceUrl('');
        setEvidenceText('');
        // Refresh activities list
        const updated = await activityApi.getMine();
        if (updated.success) setMyActivities(updated.data);
      }
    } catch (err) {
      toast.error(err.error || 'Failed to submit proof.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c._id === selectedCampaignId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Promote & Earn
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Share products, generate referral visits, submit proof, and receive verified simulated rewards.
        </p>
      </div>

      {/* Main Campaign Selection & Link Generation Box */}
      <div className="p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            1. Select Campaign to Promote
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
          >
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.sponsorId?.brandName} — {c.title} (+₹{c.rewardAmount})
              </option>
            ))}
          </select>
        </div>

        {selectedCampaign && (
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-oxygen-red">Reward Bounty</span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                ₹{selectedCampaign.rewardAmount} Per Verified Submission
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{selectedCampaign.requirements?.text}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-oxygen-red text-white text-xs font-bold">
              Budget: ₹{Math.max(0, selectedCampaign.totalBudget - selectedCampaign.spentBudget)} left
            </span>
          </div>
        )}

        {/* Unique referral link */}
        {isAuthenticated && referralLink && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Your Unique Share Link
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink.url}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-oxygen-darkSubtle font-mono text-xs text-slate-800 dark:text-slate-200 border border-oxygen-lightBorder dark:border-oxygen-darkBorder focus:outline-none"
              />
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => copyLink(referralLink.url)}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center space-x-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="flex space-x-6 text-xs text-slate-500 pt-1">
              <span>Total Clicks: <strong className="text-slate-900 dark:text-white">{referralLink.clicks}</strong></span>
              <span>Unique Visits: <strong className="text-slate-900 dark:text-white">{referralLink.uniqueVisits}</strong></span>
              <span>Qualifying Actions: <strong className="text-slate-900 dark:text-white">{referralLink.qualifyingActions}</strong></span>
            </div>
          </div>
        )}

        {/* Proof Submission Form */}
        <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              3. Submit Evidence of Promotion
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Upload a public screenshot URL or provide detailed text proof (e.g. social post link, WhatsApp status view count, reach). Submissions undergo human admin verification before reward is credited.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Screenshot / Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or https://imgur.com/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Proof Description & Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe where you shared the link (e.g., posted on WhatsApp status with 80+ views, Instagram story, Telegram group)..."
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Link claim alone never auto-rewards; admin review required.</span>
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-full bg-oxygen-red hover:bg-oxygen-redHover disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-oxygen-red/30 transition-all flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Proof for Verification'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MY SUBMITTED PROOFS QUEUE */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          My Promotional Proofs History
        </h2>

        {myActivities.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-oxygen-darkCard rounded-3xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-500 text-xs">
            No promotional proofs submitted yet. Choose a campaign above to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {myActivities.map((act) => (
              <div
                key={act._id}
                className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {act.campaignId?.sponsorId?.brandName}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {act.campaignId?.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {act.evidenceText}
                  </p>
                  {act.decisionReason && (
                    <div className="text-[11px] p-2 rounded-xl bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-700 dark:text-slate-300">
                      <strong>Admin note:</strong> {act.decisionReason}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 block">
                    Submitted: {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                      act.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : act.status === 'rejected'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {act.status === 'approved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : act.status === 'rejected' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span className="capitalize">{act.status}</span>
                  </span>

                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ₹{act.campaignId?.rewardAmount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
