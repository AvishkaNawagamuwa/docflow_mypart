import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole, DASHBOARD_ROUTES } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={DASHBOARD_ROUTES[user.role]} replace />;
  }

  return <>{children}</>;
}

export function RedirectToDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={DASHBOARD_ROUTES[user.role]} replace />;
}
