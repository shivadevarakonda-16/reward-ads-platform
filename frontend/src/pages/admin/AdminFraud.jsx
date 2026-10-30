import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { ShieldAlert, AlertTriangle, UserX, UserCheck, Smartphone, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminFraud = () => {
  const [data, setData] = useState({ flaggedViews: [], duplicateFingerprints: [] });
  const [loading, setLoading] = useState(true);

  const fetchFraudLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getFraudLogs({ limit: 50 });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load fraud analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudLogs();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const reason = window.prompt(`Enter reason for marking user as ${nextStatus}:`, 'Security policy action');
    if (!reason) return;

    try {
      const res = await adminApi.toggleUserStatus(userId, { status: nextStatus, reason });
      if (res.success) {
        toast.success(`User status changed to ${nextStatus}`);
        fetchFraudLogs();
      }
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Fraud & Anomaly Sentinel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor velocity abuse, suspicious heartbeat signatures, duplicate device clusters, and enforce suspensions.
        </p>
      </div>

      {/* DUPLICATE DEVICE CLUSTERS */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Multi-Account Device Clusters (Collisions)
          </h2>
        </div>

        {data.duplicateFingerprints?.length === 0 ? (
          <div className="p-6 text-center rounded-3xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-500 text-xs">
            No suspicious multi-account device collisions detected.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.duplicateFingerprints.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-3xl bg-white dark:bg-oxygen-darkCard border border-amber-500/20 shadow-soft space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Fingerprint: {item._id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    {item.count} Accounts Linked
                  </span>
                </div>

                <div className="space-y-1.5 divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder pt-1">
                  {item.users.map((u) => (
                    <div key={u.id} className="pt-1.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                        <span className="text-[10px] text-slate-400 block">{u.email}</span>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          u.status === 'suspended'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-600 hover:text-red-500'
                        }`}
                      >
                        {u.status === 'suspended' ? 'Suspended' : 'Suspend User'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLAGGED AD VIEWS LEDGER */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Flagged Watch & Earn Sessions
          </h2>
        </div>

        <div className="rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-400 uppercase font-semibold bg-slate-50 dark:bg-oxygen-darkSubtle/30">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Flag Reason</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Watch Percent</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">User Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder">
                {data.flaggedViews?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No flagged sessions found.
                    </td>
                  </tr>
                ) : (
                  data.flaggedViews?.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-oxygen-darkSubtle/30">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {v.userId?.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{v.userId?.email}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {v.campaignId?.title}
                      </td>
                      <td className="py-3 px-4 font-semibold text-red-500 max-w-xs truncate">
                        {v.flagReason || 'Irregular playback velocity'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{v.ipAddress || 'unknown'}</td>
                      <td className="py-3 px-4 font-bold">{v.watchPercent}%</td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(v.userId?._id, v.userId?.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            v.userId?.status === 'suspended'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                          }`}
                        >
                          {v.userId?.status === 'suspended' ? 'Suspended' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
