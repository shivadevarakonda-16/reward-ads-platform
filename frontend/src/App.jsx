import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AdminSidebar } from './components/AdminSidebar';

import { Home } from './pages/Home';
import { WatchFeed } from './pages/WatchFeed';
import { CampaignDetail } from './pages/CampaignDetail';
import { Promote } from './pages/Promote';
import { Deals } from './pages/Deals';
import { Wallet } from './pages/Wallet';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminCampaigns } from './pages/admin/AdminCampaigns';
import { AdminActivities } from './pages/admin/AdminActivities';
import { AdminRewards } from './pages/admin/AdminRewards';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminSponsors } from './pages/admin/AdminSponsors';
import { AdminFraud } from './pages/admin/AdminFraud';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminUsers } from './pages/admin/AdminUsers';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isWatchPath = location.pathname === '/watch';

  return (
    <div className="min-h-screen bg-oxygen-lightBg dark:bg-oxygen-darkBg text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar (omitted or compact on Watch feed if desired, but nice to keep consistent) */}
      <Navbar />

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Render appropriate desktop sidebar */}
        {isAdminPath ? (
          <AdminSidebar />
        ) : !isWatchPath ? (
          <Sidebar />
        ) : null}

        {/* Main Content Viewport */}
        <main className={`flex-1 min-w-0 ${isWatchPath ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          <Routes>
            {/* Consumer routes */}
            <Route path="/" element={<Home />} />
            <Route path="/watch" element={<WatchFeed />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/deals" element={<Deals />} />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public referral redirect bridge */}
            <Route
              path="/r/:code"
              element={<Navigate to="/" replace />}
            />

            {/* Admin protected routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminOverview />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <AdminRoute>
                  <AdminCampaigns />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/activities"
              element={
                <AdminRoute>
                  <AdminActivities />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/rewards"
              element={
                <AdminRoute>
                  <AdminRewards />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sponsors"
              element={
                <AdminRoute>
                  <AdminSponsors />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/fraud"
              element={
                <AdminRoute>
                  <AdminFraud />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation (only on consumer screens) */}
      {!isAdminPath && <BottomNav />}
    </div>
  );
};
