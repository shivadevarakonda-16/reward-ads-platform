import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const RewardBadgeRing = ({
  progress = 0,
  rewardAmount = 5,
  completed = false,
  alreadyEarned = false,
  size = 56,
  strokeWidth = 3
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  const isDone = completed || alreadyEarned;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-white/20"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? '#10B981' : '#EB0028'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={false}
          animate={{
            strokeDashoffset: isDone ? 0 : strokeDashoffset,
            stroke: isDone ? '#10B981' : '#EB0028'
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className={`absolute inset-1 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-md backdrop-blur-md ${
          isDone
            ? 'bg-emerald-500/90 text-white'
            : 'bg-black/60 text-white border border-white/10'
        }`}
        animate={isDone ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {isDone ? (
          <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <>
            <span className="text-[10px] opacity-80 leading-none">Earn</span>
            <span className="text-sm font-extrabold text-oxygen-red leading-tight">+₹{rewardAmount}</span>
          </>
        )}
      </motion.div>
    </div>
  );
};
