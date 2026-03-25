import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LotsPage from './pages/LotsPage';
import LotDetailPage from './pages/LotDetailPage';
import BarsPage from './pages/BarsPage';
import TransfersPage from './pages/TransfersPage';
import AuditPage from './pages/AuditPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lots" element={<LotsPage />} />
          <Route path="/lots/:id" element={<LotDetailPage />} />
          <Route path="/bars" element={<BarsPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/audit" element={
            <ProtectedRoute roles={['admin', 'auditor']}>
              <AuditPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="login-page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
