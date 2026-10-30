import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  CheckSquare,
  Award,
  Package,
  Building2,
  ShieldAlert,
  History,
  Users,
  ArrowLeft
} from 'lucide-react';

const ADMIN_LINKS = [
  { path: '/admin', label: 'Overview & KPIs', icon: LayoutDashboard, exact: true },
  { path: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/admin/activities', label: 'Activity Queue', icon: CheckSquare, badge: 'Queue' },
  { path: '/admin/rewards', label: 'Reward Management', icon: Award },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/sponsors', label: 'Sponsors & Budgets', icon: Building2 },
  { path: '/admin/fraud', label: 'Fraud & Security', icon: ShieldAlert },
  { path: '/admin/audit', label: 'Audit Logs', icon: History },
  { path: '/admin/users', label: 'User Directory', icon: Users }
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-oxygen-darkCard border-r border-oxygen-lightBorder dark:border-oxygen-darkBorder h-[calc(100vh-4rem)] sticky top-16 flex flex-col p-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Control</span>
        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
          Role Guarded
        </span>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-oxygen-darkSubtle hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-oxygen-red/10 text-oxygen-red text-[9px] font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-oxygen-lightBorder dark:border-oxygen-darkBorder">
        <Link
          to="/"
          className="flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Consumer App</span>
        </Link>
      </div>
    </aside>
  );
};
