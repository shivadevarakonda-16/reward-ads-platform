import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import {
  Users,
  Megaphone,
  Clock,
  Award,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  Building2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

export const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load admin stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading administrative intelligence...</div>;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Platform Intelligence Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time KPIs, sponsor budget allocations, reward throughput, and activity queue.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-oxygen-darkSubtle text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {kpis.totalUsers}
          </h3>
          <span className="text-[10px] text-slate-400">Active consumer accounts</span>
        </div>

        {/* Active Campaigns */}
        <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-oxygen-red" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {kpis.activeCampaigns}
          </h3>
          <span className="text-[10px] text-slate-400">Live in feed & discovery</span>
        </div>

        {/* Pending Reviews */}
        <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {kpis.pendingReviews}
          </h3>
          <span className="text-[10px] text-slate-400">Awaiting admin verification</span>
        </div>

        {/* Total Rewards Paid */}
        <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Rewards Paid</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{kpis.totalRewardsPaid?.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400">Approved simulated credits</span>
        </div>

        {/* Budget Remaining */}
        <div className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Budget Remaining</span>
            <Wallet className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ₹{kpis.remainingBudget?.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400">
            From ₹{kpis.totalBudget?.toLocaleString('en-IN')} total pool
          </span>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Rewards Paid Throughput */}
        <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rewards Disbursed (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-400">Daily aggregate sum of approved user payouts</p>
            </div>
            <TrendingUp className="w-5 h-5 text-oxygen-red" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.rewardsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRewardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151517',
                    border: '1px solid #2A2A30',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [`₹${val}`, 'Disbursed']}
                />
                <Area type="monotone" dataKey="amount" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#adminRewardGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaigns by Type */}
        <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Campaigns Distribution by Type
              </h3>
              <p className="text-xs text-slate-400">Breakdown of promotional formats across active campaigns</p>
            </div>
            <PieIcon className="w-5 h-5 text-purple-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.campaignsByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151517',
                    border: '1px solid #2A2A30',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#EB0028" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP SPONSORS BY BUDGET ALLOCATION */}
      <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Active Sponsors by Budget</h3>
          </div>
          <span className="text-xs text-slate-400">Sorted by spent budget</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-400 uppercase font-semibold">
                <th className="pb-3 px-3">Brand Name</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Total Budget</th>
                <th className="pb-3 px-3">Spent Budget</th>
                <th className="pb-3 px-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder">
              {charts.topSponsors?.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-oxygen-darkSubtle/30">
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                    {s.brandName}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{s.category}</td>
                  <td className="py-3.5 px-3 font-mono font-semibold">₹{s.totalBudget?.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 font-mono text-emerald-500 font-bold">₹{s.spentBudget?.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-500">
                    ₹{Math.max(0, s.totalBudget - s.spentBudget)?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
