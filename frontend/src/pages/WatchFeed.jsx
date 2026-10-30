import React, { useState, useEffect, useRef, useCallback } from 'react';
import { campaignApi, adViewApi, referralApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RewardBadgeRing } from '../components/RewardBadgeRing';
import { SkeletonReel } from '../components/SkeletonLoader';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Heart,
  Bookmark,
  Share2,
  Tag,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const WatchFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dailyStats, setDailyStats] = useState({ todayAdsWatched: 0, todayEarned: 0, remainingAdsAllowed: 30 });

  const containerRef = useRef(null);

  // Load daily watch statistics
  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adViewApi.getDailyStats();
      if (res.success) {
        setDailyStats({
          todayAdsWatched: res.todayAdsWatched,
          todayEarned: res.todayEarned,
          remainingAdsAllowed: res.remainingAdsAllowed
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStats();
  }, [isAuthenticated]);

  // Load feed campaigns
  const loadFeed = async (pageNum = 1) => {
    try {
      const res = await campaignApi.getFeed({ page: pageNum, limit: 6 });
      if (res.success) {
        if (pageNum === 1) {
          setCampaigns(res.data);
        } else {
          setCampaigns(prev => [...prev, ...res.data]);
        }
        setHasMore(res.pagination.page < res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load video ads feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(1);
  }, []);

  // Infinite scroll trigger
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - (scrollTop + clientHeight) < clientHeight * 1.5) {
      setPage(prev => {
        const nextPage = prev + 1;
        loadFeed(nextPage);
        return nextPage;
      });
    }
  }, [loading, hasMore]);

  // Keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: height, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        containerRef.current.scrollBy({ top: -height, behavior: 'smooth' });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden select-none">
      {/* Top Floating Mini-Counter */}
      <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-oxygen-red" />
          <span className="font-medium">
            Today: <strong className="text-white">{dailyStats.todayAdsWatched}</strong> watched
          </span>
          <span className="text-white/40">•</span>
          <span className="font-bold text-emerald-400">+₹{dailyStats.todayEarned}</span>
        </div>

        {/* Mute / Unmute pill */}
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className="pointer-events-auto p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors shadow-lg"
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-oxygen-red" />}
        </button>
      </div>

      {/* Main Reels Vertical Feed Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full reels-feed-container overflow-y-scroll overflow-x-hidden"
      >
        {loading && campaigns.length === 0 ? (
          <SkeletonReel />
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white px-6 text-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-bold">No Active Ad Campaigns</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Check back soon for freshly sponsored brand campaigns.
            </p>
            <button
              onClick={() => loadFeed(1)}
              className="mt-4 px-4 py-2 rounded-full bg-oxygen-red text-white text-xs font-semibold"
            >
              Refresh Feed
            </button>
          </div>
        ) : (
          campaigns.map((camp, idx) => (
            <ReelCard
              key={camp._id}
              campaign={camp}
              isActive={idx === activeIndex}
              isMuted={isMuted}
              onVisible={() => setActiveIndex(idx)}
              onRewardEarned={() => fetchStats()}
              onOpenProduct={() => setSelectedProduct(camp.productId || camp)}
            />
          ))
        )}
      </div>

      {/* Product / Deal Details Bottom Sheet Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-white dark:bg-oxygen-darkCard rounded-t-4xl sm:rounded-4xl p-6 shadow-2xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-oxygen-red tracking-wider">
                    {selectedProduct.category || 'Featured'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedProduct.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {selectedProduct.images?.[0] && (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.title}
                  className="w-full h-48 object-cover rounded-3xl mb-4"
                />
              )}

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {selectedProduct.description || 'Verified sponsor partner product.'}
              </p>

              {selectedProduct.price && (
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    ₹{selectedProduct.discountPrice || selectedProduct.price}
                  </span>
                  {selectedProduct.discountPrice && (
                    <span className="text-sm line-through text-slate-400">
                      ₹{selectedProduct.price}
                    </span>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    toast.success('Simulated deal unlocked! Promo applied.');
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-3 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold transition-all shadow-md"
                >
                  Get Simulated Deal
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-3 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// INDIVIDUAL REEL CARD WITH HEARTBEAT ENGINE
// ==========================================
const ReelCard = ({ campaign, isActive, isMuted, onVisible, onRewardEarned, onOpenProduct }) => {
  const { isAuthenticated } = useAuth();
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adViewId, setAdViewId] = useState(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [watchPercent, setWatchPercent] = useState(0);
  const [rewardCompleted, setRewardCompleted] = useState(campaign.alreadyEarned || false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Compute a rock-solid video source
  const getInitialVideoSrc = () => {
    const raw = campaign.videoUrl;
    if (!raw || raw.includes('commondatastorage.googleapis.com')) {
      const idx = campaign._id ? (campaign._id.charCodeAt(campaign._id.length - 1) % 6) + 1 : 1;
      return `/videos/ad${idx}.mp4`;
    }
    return raw;
  };

  const [videoSrc, setVideoSrc] = useState(getInitialVideoSrc);

  useEffect(() => {
    setVideoSrc(getInitialVideoSrc());
    setHasError(false);
  }, [campaign.videoUrl, campaign._id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // IntersectionObserver to detect >= 70% visibility
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.7) {
            onVisible();
          }
        });
      },
      { threshold: [0.7] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  // Start ad view session on becoming active
  useEffect(() => {
    let currentSessionId = null;

    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }

      if (isAuthenticated && !campaign.alreadyEarned && !rewardCompleted) {
        adViewApi
          .start({
            campaignId: campaign._id,
            videoDurationSec: campaign.durationSec || 15
          })
          .then((res) => {
            if (res.success) {
              setAdViewId(res.adViewId);
              currentSessionId = res.adViewId;
            }
          })
          .catch((err) => {
            console.warn('Could not initialize ad session:', err.error);
          });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      // Send end ad view if session was active
      if (adViewId && !rewardCompleted) {
        adViewApi.end(adViewId, { currentTime: playedSeconds, cumulativePlayedSeconds: playedSeconds }).catch(() => {});
        setAdViewId(null);
      }
    }

    return () => {
      if (currentSessionId && !rewardCompleted) {
        adViewApi.end(currentSessionId, { currentTime: playedSeconds, cumulativePlayedSeconds: playedSeconds }).catch(() => {});
      }
    };
  }, [isActive, campaign._id, isAuthenticated]);

  // Server-validated heartbeat loop (every 2 seconds while active, playing, and tab visible)
  useEffect(() => {
    if (!isActive || !isPlaying || !adViewId || rewardCompleted || !isAuthenticated) return;

    const interval = setInterval(async () => {
      // Pause counting if tab is hidden or window blurred
      if (document.hidden) return;

      const currentVid = videoRef.current;
      if (!currentVid || currentVid.paused) return;

      const currTime = currentVid.currentTime;
      const newPlayed = playedSeconds + 2;
      setPlayedSeconds(newPlayed);

      try {
        const res = await adViewApi.heartbeat(adViewId, {
          currentTime: currTime,
          cumulativePlayedSeconds: newPlayed
        });

        if (res.success) {
          setWatchPercent(res.watchPercent);

          // If qualified (>= 90%), trigger completion
          if (res.qualified && !rewardCompleted) {
            handleCompleteAd(adViewId, currTime, newPlayed);
          }
        }
      } catch (err) {
        console.warn('Heartbeat error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, isPlaying, adViewId, playedSeconds, rewardCompleted, isAuthenticated]);

  // Complete ad view and claim reward
  const handleCompleteAd = async (sessionId, currTime, cumulativePlayed) => {
    try {
      const res = await adViewApi.end(sessionId, {
        currentTime: currTime,
        cumulativePlayedSeconds: cumulativePlayed
      });

      if (res.success && res.completed) {
        setRewardCompleted(true);
        setWatchPercent(100);
        toast.success(`🎉 Reward unlocked! ₹${campaign.rewardAmount} credited.`);
        onRewardEarned();
      } else if (res.rewardError) {
        console.log(res.rewardError);
      }
    } catch (err) {
      console.warn('Completion error:', err);
    }
  };

  // Tap to pause/play
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Share functionality with Web Share API and referral link generation
  const handleShare = async () => {
    if (!isAuthenticated) {
      toast('Sign in to generate referral links and earn referral commissions!', { icon: 'ℹ️' });
      return;
    }

    try {
      const res = await referralApi.generate({
        campaignId: campaign._id,
        productId: campaign.productId?._id
      });

      if (res.success && res.data) {
        const shareUrl = res.data.url;
        if (navigator.share) {
          await navigator.share({
            title: campaign.title,
            text: `Check out ${campaign.title} on RewardAds!`,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Unique referral link copied to clipboard!');
        }
      }
    } catch (err) {
      toast.error('Could not generate share link.');
    }
  };

  return (
    <div
      ref={cardRef}
      className="reel-item relative w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-black overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={campaign.thumbnailUrl}
        loop
        playsInline
        preload="auto"
        muted={isMuted}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onError={(e) => {
          console.warn('Video stream failed to load:', videoSrc);
          if (!videoSrc.startsWith('/videos/')) {
            const fallbackIdx = campaign._id ? (campaign._id.charCodeAt(campaign._id.length - 1) % 6) + 1 : 1;
            setVideoSrc(`/videos/ad${fallbackIdx}.mp4`);
            setHasError(false);
          } else {
            setHasError(true);
          }
        }}
        onClick={togglePlay}
        className="w-full h-full object-cover sm:object-contain sm:max-w-md mx-auto cursor-pointer"
      />

      {/* Buffering Skeleton / Loader */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-oxygen-red animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay indicator when tapped */}
      {!isPlaying && !isBuffering && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110">
            <Play className="w-8 h-8 ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Fallback state if video failed to load */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-sm font-semibold">Video stream temporarily unavailable</p>
          <p className="text-xs text-slate-400 mt-1">Showing fallback ad snapshot</p>
          <button
            onClick={() => {
              setHasError(false);
              videoRef.current?.load();
            }}
            className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry stream</span>
          </button>
        </div>
      )}

      {/* RIGHT ACTION COLUMN */}
      <div className="absolute right-3 sm:right-6 bottom-20 z-20 flex flex-col items-center space-y-4">
        {/* Animated Reward Progress Ring Badge */}
        <RewardBadgeRing
          progress={watchPercent}
          rewardAmount={campaign.rewardAmount}
          completed={rewardCompleted}
          alreadyEarned={campaign.alreadyEarned}
          size={58}
        />

        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="flex flex-col items-center group"
        >
          <div className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-oxygen-red text-oxygen-red' : 'text-white'}`}
            />
          </div>
          <span className="text-[10px] text-white/80 font-semibold mt-1">
            {isLiked ? '1.2k' : '1.1k'}
          </span>
        </button>

        {/* Save Button */}
        <button
          onClick={() => {
            setIsSaved(!isSaved);
            toast.success(isSaved ? 'Removed from saved' : 'Saved to favorites');
          }}
          className="flex flex-col items-center group"
        >
          <div className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <Bookmark
              className={`w-5 h-5 ${isSaved ? 'fill-white text-white' : 'text-white'}`}
            />
          </div>
          <span className="text-[10px] text-white/80 font-semibold mt-1">Save</span>
        </button>

        {/* Share Button (Generates Referral Link) */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center group"
        >
          <div className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white/80 font-semibold mt-1">Share</span>
        </button>
      </div>

      {/* BOTTOM INFO OVERLAY (Glassmorphic) */}
      <div className="absolute left-3 right-16 sm:left-6 sm:right-24 bottom-6 z-20 pointer-events-none">
        <div className="max-w-md pointer-events-auto space-y-2">
          {/* Sponsor chip */}
          <div className="flex items-center space-x-2">
            {campaign.sponsorId?.logoUrl ? (
              <img
                src={campaign.sponsorId.logoUrl}
                alt={campaign.sponsorId.brandName}
                className="w-7 h-7 rounded-full object-cover border border-white/20 bg-white"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {campaign.sponsorId?.brandName?.[0] || 'S'}
              </div>
            )}
            <span className="text-xs font-bold text-white tracking-wide drop-shadow-md">
              {campaign.sponsorId?.brandName}
            </span>
            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
              Sponsored
            </span>
          </div>

          {/* Title & Caption */}
          <h2 className="text-sm font-bold text-white leading-snug drop-shadow-md line-clamp-1">
            {campaign.title}
          </h2>
          <p className="text-xs text-white/90 drop-shadow-md line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>

          {/* Action Chips */}
          <div className="flex items-center space-x-2 pt-1">
            {campaign.productId && (
              <button
                onClick={onOpenProduct}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold transition-all border border-white/10"
              >
                <Tag className="w-3.5 h-3.5 text-oxygen-red" />
                <span className="truncate max-w-[130px]">{campaign.productId.title}</span>
              </button>
            )}

            <button
              onClick={onOpenProduct}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold shadow-lg shadow-oxygen-red/40 transition-all"
            >
              <span>Get Deal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
