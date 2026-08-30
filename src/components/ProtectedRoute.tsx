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

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-white">
 <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
 // Redirect to their respective dashboard if they don't have permission for this route
 return <Navigate to={`/${userData.role}-dashboard`} replace />;
 }

 return <>{children}</>;
};
