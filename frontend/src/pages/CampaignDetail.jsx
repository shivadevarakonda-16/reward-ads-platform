import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { campaignApi, referralApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PlaySquare,
  Share2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  Clock,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await campaignApi.getCampaignById(id);
        if (res.success) {
          setCampaign(res.campaign);
          setUserProgress(res.userProgress);
        }
      } catch (err) {
        toast.error('Campaign not found.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const handleGenerateLink = async () => {
    if (!isAuthenticated) {
      toast('Please log in to generate your referral link.');
      navigate('/login');
      return;
    }

    try {
      const res = await referralApi.generate({
        campaignId: campaign._id,
        productId: campaign.productId?._id
      });
      if (res.success) {
        setReferralLink(res.data);
        toast.success('Unique referral link generated!');
      }
    } catch (err) {
      toast.error('Failed to generate link.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading campaign details...</div>;
  }

  if (!campaign) return null;

  const remainingBudget = Math.max(0, campaign.totalBudget - campaign.spentBudget);
  const budgetPercent = Math.min(100, (campaign.spentBudget / campaign.totalBudget) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link
        to="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Discover</span>
      </Link>

      {/* Main Campaign Card */}
      <div className="rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft overflow-hidden">
        {/* Banner image / video preview */}
        <div className="relative h-64 sm:h-80 bg-slate-900 overflow-hidden">
          <img
            src={campaign.thumbnailUrl || 'https://picsum.photos/1200/600'}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-4 left-4 flex space-x-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/15">
              {campaign.type}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white font-bold text-xs">
              {campaign.status.toUpperCase()}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-oxygen-red uppercase tracking-wider drop-shadow-md">
                {campaign.sponsorId?.brandName}
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
                {campaign.title}
              </h1>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-2xl bg-oxygen-red text-white text-base font-extrabold shadow-lg">
              ₹{campaign.rewardAmount} Reward
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Budget Progress Bar */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Campaign Budget Remaining</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{remainingBudget.toLocaleString('en-IN')} / ₹{campaign.totalBudget.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-oxygen-red rounded-full transition-all duration-500"
                style={{ width: `${100 - budgetPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              Budget utilization: {budgetPercent.toFixed(1)}% spent. Rewards are issued until budget is exhausted.
            </span>
          </div>

          {/* User's Progress / Eligibility Status */}
          {isAuthenticated && userProgress && (
            <div className="p-4 rounded-3xl bg-oxygen-red/5 border border-oxygen-red/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {userProgress.hasEarned ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Clock className="w-6 h-6 text-oxygen-red" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {userProgress.hasEarned
                      ? 'Reward Earned & Credited'
                      : userProgress.existingReward?.status === 'pending'
                      ? 'Reward Pending Administrative Verification'
                      : 'Eligible to Participate'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Max claims per user: {campaign.maxParticipantsPerUser}
                  </p>
                </div>
              </div>

              {campaign.type === 'AD_VIEW' && (
                <Link
                  to="/watch"
                  className="px-4 py-2 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold transition-all shadow-sm"
                >
                  Watch Reel
                </Link>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">About the Campaign</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {campaign.description}
            </p>
          </div>

          {/* Action Requirements */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-oxygen-darkSubtle/40 border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Requirements to Earn ₹{campaign.rewardAmount}
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
              {campaign.requirements?.text || 'Complete the designated campaign interaction to qualify.'}
            </p>
            <span className="text-[11px] text-slate-400 block">
              Required Proof Evidence: <strong className="uppercase">{campaign.requirements?.evidenceType || 'None'}</strong>
            </span>
          </div>

          {/* Promote / Referral Link Generator */}
          {(campaign.type === 'PROMOTE' || campaign.type === 'REFERRAL') && (
            <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Your Unique Referral Link</h4>
                  <p className="text-xs text-slate-500">Share with friends to record visits and qualify for reward.</p>
                </div>
                {!referralLink && (
                  <button
                    onClick={handleGenerateLink}
                    className="px-4 py-2 rounded-full bg-oxygen-red text-white text-xs font-bold shadow-md hover:bg-oxygen-redHover transition-all"
                  >
                    Generate Link
                  </button>
                )}
              </div>

              {referralLink && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={referralLink.url}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-oxygen-darkSubtle text-xs font-mono text-slate-800 dark:text-slate-200 border border-oxygen-lightBorder dark:border-oxygen-darkBorder focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(referralLink.url)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center space-x-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex space-x-4 text-xs text-slate-500 pt-1">
                    <span>Clicks: <strong>{referralLink.clicks}</strong></span>
                    <span>Unique Visits: <strong>{referralLink.uniqueVisits}</strong></span>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/promote"
                      state={{ selectedCampaignId: campaign._id, referralLinkId: referralLink._id }}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-oxygen-red hover:underline"
                    >
                      <span>Submit promotional proof screenshot for verification</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold block text-slate-500">Terms & Simulated Rewards Notice:</span>
            <p>{campaign.termsAndConditions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
