import React from 'react';

export const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800/60 p-4 ${className}`}>
    <div className="h-44 bg-slate-300 dark:bg-slate-700/60 rounded-2xl mb-4" />
    <div className="h-4 bg-slate-300 dark:bg-slate-700/60 rounded-full w-3/4 mb-2" />
    <div className="h-3 bg-slate-300 dark:bg-slate-700/60 rounded-full w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <div className="h-6 bg-slate-300 dark:bg-slate-700/60 rounded-full w-1/3" />
      <div className="h-8 bg-slate-300 dark:bg-slate-700/60 rounded-full w-20" />
    </div>
  </div>
);

export const SkeletonReel = () => (
  <div className="w-full h-full flex flex-col justify-between p-6 bg-slate-900 animate-pulse">
    <div className="flex justify-between items-center pt-8">
      <div className="h-8 bg-slate-800 rounded-full w-28" />
      <div className="h-8 bg-slate-800 rounded-full w-10" />
    </div>
    <div className="space-y-4 pb-16 max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-slate-800" />
        <div className="h-4 bg-slate-800 rounded-full w-32" />
      </div>
      <div className="h-6 bg-slate-800 rounded-full w-4/5" />
      <div className="h-4 bg-slate-800 rounded-full w-3/5" />
      <div className="h-10 bg-slate-800 rounded-full w-36" />
    </div>
  </div>
);
