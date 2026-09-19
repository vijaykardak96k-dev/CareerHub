import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeRouteFor, useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';
import { Spinner } from './Ui';

/**
 * Route guard. The backend enforces the same rules; this only keeps the user
 * away from pages that would fail anyway.
 */
export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking your session" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={homeRouteFor(user.role)} replace />;
  }

  return <Outlet />;
}
