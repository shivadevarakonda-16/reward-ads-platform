import React, { useState, useEffect } from 'react';
import { walletApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CountUp } from '../components/CountUp';
import {
  Wallet as WalletIcon,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWallet = async () => {
    try {
      const [wRes, tRes] = await Promise.all([
        walletApi.getSummary(),
        walletApi.getTransactions({ type: activeFilter || undefined })
      ]);

      if (wRes.success) setWalletData(wRes);
      if (tRes.success) setTransactions(tRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [activeFilter]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    const minAmount = walletData?.wallet?.minWithdrawalAmount || 100;

    if (isNaN(amountNum) || amountNum < minAmount) {
      toast.error(`Minimum withdrawal amount is ₹${minAmount}`);
      return;
    }

    if (amountNum > (user?.walletBalance || 0)) {
      toast.error('Withdrawal amount exceeds your redeemable wallet balance.');
      return;
    }

    try {
      setWithdrawing(true);
      const res = await walletApi.withdraw({
        amount: amountNum,
        paymentMethod,
        accountDetails: accountDetails.trim() || 'Simulated Account'
      });

      if (res.success) {
        toast.success(`Simulated payout of ₹${amountNum} successfully processed!`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountDetails('');
        await refreshUser();
        fetchWallet();
      }
    } catch (err) {
      toast.error(err.error || 'Failed to process simulated withdrawal.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading wallet ledger...</div>;
  }

  const wallet = walletData?.wallet || {};
  const stats = walletData?.stats || {};
  const chartData = walletData?.chartData || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Banner with Simulation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Rewards Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your earned rewards, pending verifications, and simulated payout ledger.
          </p>
        </div>

        {/* Prototype note */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Prototype - simulated rewards</span>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Approved / Redeemable Balance */}
        <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Redeemable Balance
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              <CountUp end={wallet.balance || 0} />
            </h3>
            <span className="text-[11px] text-slate-400">Available for simulated payout</span>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-2.5 rounded-full bg-oxygen-red hover:bg-oxygen-redHover text-white text-xs font-bold shadow-md shadow-oxygen-red/30 transition-all"
          >
            Withdraw Simulated Funds
          </button>
        </div>

        {/* Pending Balance */}
        <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              <CountUp end={wallet.pendingBalance || 0} />
            </h3>
            <span className="text-[11px] text-slate-400">Under admin review queue</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-snug">
            Promotional activities and submissions currently being reviewed by administrators.
          </p>
        </div>

        {/* Total Lifetime Earned */}
        <div className="p-6 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Lifetime Earned
            </span>
            <div className="w-8 h-8 rounded-full bg-oxygen-red/10 text-oxygen-red flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              <CountUp end={wallet.totalEarned || 0} />
            </h3>
            <span className="text-[11px] text-slate-400">From ads, promos & referrals</span>
          </div>

          <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
            <span>Active Coupons: <strong>{stats.couponsAvailable || 0}</strong></span>
            <span>Redeemed: <strong>{stats.couponsRedeemed || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* EARNINGS TIMELINE CHART */}
      <div className="p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Earnings History (Past 14 Days)</h3>
            <p className="text-xs text-slate-400">Daily credits from completed views and approved tasks</p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span>Active Rewards</span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EB0028" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EB0028" stopOpacity={0.0} />
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
                formatter={(val) => [`₹${val}`, 'Earned']}
              />
              <Area type="monotone" dataKey="amount" stroke="#EB0028" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REJECTED REWARDS NOTICE (IF ANY) */}
      {stats.recentRejected && stats.recentRejected.length > 0 && (
        <div className="p-5 rounded-3xl bg-red-500/5 border border-red-500/20 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            <span>Rejected Submissions & Feedback</span>
          </div>
          <div className="space-y-1.5">
            {stats.recentRejected.map((rej) => (
              <div key={rej._id} className="text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>{rej.campaignId?.title || 'Promotion'}</span>
                <span className="text-red-500 font-semibold">{rej.reason || 'Evidence failed quality criteria'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULL TRANSACTION HISTORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Ledger & Transactions
          </h2>

          {/* Filter chips */}
          <div className="flex space-x-1.5">
            {[
              { id: '', label: 'All' },
              { id: 'credit', label: 'Credits' },
              { id: 'withdrawal', label: 'Withdrawals' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-oxygen-darkCard text-slate-600 dark:text-slate-400 border border-oxygen-lightBorder dark:border-oxygen-darkBorder'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-oxygen-darkCard rounded-3xl border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-500 text-xs">
            No transactions found for this filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx._id}
                  className="p-4 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tx.note || (isCredit ? 'Reward Credited' : 'Withdrawal')}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()} • Balance after: ₹{tx.balanceAfter}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold ${
                      isCredit ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {isCredit ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-8 rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-2xl space-y-5"
            >
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Simulated Payout Request
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Test simulated fund withdrawal against your approved balance. (Minimum: ₹{wallet.minWithdrawalAmount})
                </p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={wallet.minWithdrawalAmount}
                    max={user?.walletBalance || 0}
                    placeholder={`Min ₹${wallet.minWithdrawalAmount}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Available balance: ₹{user?.walletBalance || 0}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Simulated Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Direct IMPS / NEFT Bank Transfer</option>
                    <option value="Amazon Pay">Amazon Pay Gift Card Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    VPA / Account Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi or Account number + IFSC"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-oxygen-darkSubtle border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oxygen-red"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
                  Notice: This is a sandbox demonstration. No real bank accounts or payment gateways are contacted.
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="flex-1 py-3 rounded-full bg-oxygen-red hover:bg-oxygen-redHover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
                  >
                    {withdrawing ? 'Processing...' : 'Confirm Simulated Withdrawal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
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
