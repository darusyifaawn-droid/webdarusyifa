import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'guru' | 'siswa' | 'parent')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading && !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-500 tracking-wide">Memuat data akun...</p>
      </div>
    );
  }

  if (!user && !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    // Redirect to their respective dashboard if they don't have permission for this route
    return <Navigate to={`/${userData.role}-dashboard`} replace />;
  }

  return <>{children}</>;
};

