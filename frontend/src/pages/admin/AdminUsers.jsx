import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Users, Search, UserX, UserCheck, Shield, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        limit: 25
      });
      if (res.success) {
        setUsers(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, page]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = window.prompt(`Enter reason for marking user as ${nextStatus}:`, 'Admin review action');
    if (!reason) return;

    try {
      const res = await adminApi.toggleUserStatus(user._id, { status: nextStatus, reason });
      if (res.success) {
        toast.success(`User marked as ${nextStatus}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            User Directory & Wallets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search registered users, monitor ledger balances, and enforce access controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, email, code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-2xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="rounded-4xl bg-white dark:bg-oxygen-darkCard border border-oxygen-lightBorder dark:border-oxygen-darkBorder shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-oxygen-lightBorder dark:border-oxygen-darkBorder text-slate-400 uppercase font-semibold bg-slate-50 dark:bg-oxygen-darkSubtle/30">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Pending</th>
                <th className="py-3.5 px-4">Total Earned</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oxygen-lightBorder dark:divide-oxygen-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading user records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No users matched search criteria.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-oxygen-darkSubtle/30">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-slate-100 dark:bg-oxygen-darkSubtle text-slate-600 dark:text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {u.referralCode}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      ₹{u.walletBalance}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-500">
                      ₹{u.pendingBalance}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-500">
                      ₹{u.totalEarned}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
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
