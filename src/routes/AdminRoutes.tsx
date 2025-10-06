import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { GalleryManager } from '../pages/admin/GalleryManager';
import GuestsManager from '../pages/admin/GuestsManager';
import MeetingsManager from '../pages/admin/MeetingsManager';
import ContributionsManager from '../pages/admin/ContributionsManager';
import MessagesManager from '../pages/admin/MessagesManager';
import MessagesTest from '../pages/admin/MessagesTest';
import AuthDiagnostic from '../pages/admin/AuthDiagnostic';
import DashboardHome from '../pages/DashboardHome';
import { SupabaseTest } from '../pages/SupabaseTest';
import PledgesManager from '../pages/admin/PledgesManager';

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardContent />}>
          <Route index element={<DashboardHome />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="guests" element={<GuestsManager />} />
          <Route path="meetings" element={<MeetingsManager />} />
          <Route path="contributions" element={<ContributionsManager />} />
          <Route path="pledges" element={<PledgesManager />} />
          <Route path="messages" element={<MessagesManager />} />
          <Route path="messages-test" element={<MessagesTest />} />
          <Route path="auth-diag" element={<AuthDiagnostic />} />
          <Route path="supabase-test" element={<SupabaseTest />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

// This component will be rendered inside the Dashboard layout
function DashboardContent() {
  return <Outlet />;
}