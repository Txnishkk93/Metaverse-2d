import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAvatar?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAvatar = false,
}) => {
  const { isAuthenticated, avatarId } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/api/v1/signin" replace />;
  }

  if (requireAvatar && !avatarId) {
    return <Navigate to="/api/v1/avatar-select" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
