/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DashboardSiswa from './components/DashboardSiswa';
import DashboardGuru from './components/DashboardGuru';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardOrangTua from './components/DashboardOrangTua';
import JuknisPresentation from './components/JuknisPresentation';
import KaldikExternal from './components/KaldikExternal';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

function PublicRoute({ children }: { children: React.ReactNode }) {
 const { user, userData, loading } = useAuth();
 
 if (loading) return null;
 if (user && userData) {
 return <Navigate to={`/${userData.role}-dashboard`} replace />;
 }
 return <>{children}</>;
}

export default function App() {
 return (
 <ErrorBoundary>
 <AuthProvider>
 <Router>
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
 </Router>
 </AuthProvider>
 </ErrorBoundary>
 );
}
