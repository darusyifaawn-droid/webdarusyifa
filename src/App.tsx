/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

// Code split large dashboard bundles so initial login and mobile loading is near instant
const DashboardSiswa = lazy(() => import('./components/DashboardSiswa'));
const DashboardGuru = lazy(() => import('./components/DashboardGuru'));
const DashboardAdmin = lazy(() => import('./components/DashboardAdmin'));
const DashboardOrangTua = lazy(() => import('./components/DashboardOrangTua'));
const JuknisPresentation = lazy(() => import('./components/JuknisPresentation'));
const KaldikExternal = lazy(() => import('./components/KaldikExternal'));

function LoadingFallback({ message = 'Memuat modul...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 tracking-wide">{message}</p>
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  
  if (loading && !userData) {
    return <LoadingFallback message="Memeriksa sesi login..." />;
  }
  if ((user || userData) && userData?.role) {
    return <Navigate to={`/${userData.role}-dashboard`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback message="Menyiapkan halaman..." />}>
            <Routes>
              <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              
              <Route 
                path="/siswa-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['siswa']}>
                    <DashboardSiswa />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/guru-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['guru']}>
                    <DashboardGuru />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <DashboardOrangTua />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/juknis" element={<JuknisPresentation />} />
              <Route path="/kaldik" element={<KaldikExternal />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

