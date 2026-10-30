import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { History, Search, Filter, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs({
        action: actionFilter || undefined,
        page,
        limit: 30
      });
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable timeline of administrative decisions, reward state changes, and security events.
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="REWARD_APPROVED">REWARD_APPROVED</option>
          <option value="REWARD_REJECTED">REWARD_REJECTED</option>
          <option value="ACTIVITY_APPROVED">ACTIVITY_APPROVED</option>
          <option value="ACTIVITY_REJECTED">ACTIVITY_REJECTED</option>
          <option value="USER_REGISTERED">USER_REGISTERED</option>
          <option value="USER_SUSPENDED">USER_SUSPENDED</option>
          <option value="ADMIN_CAMPAIGN_CREATED">ADMIN_CAMPAIGN_CREATED</option>
          <option value="USER_WITHDRAWAL_REQUESTED">USER_WITHDRAWAL_REQUESTED</option>
        </select>
      </div>

      <div className="rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-400 uppercase font-semibold bg-slate-50 dark:bg-oxygen-darkSubtle/30">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No audit logs recorded for this filter.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-oxygen-darkSubtle/30">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-sans text-xs">
                      {log.actorId ? `${log.actorId.name} (${log.actorId.role})` : 'System Engine'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {log.entityType} ({log.entityId?.slice(-6) || '—'})
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300 max-w-sm truncate">
                      {JSON.stringify(log.meta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
