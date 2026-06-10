import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PrivateRoute — Route wrapper for authenticated pages
 * Redirects unauthenticated users to /login
 * Optionally checks for required roles
 */
export function PrivateRoute({ children, requiredRoles = null }) {
  const { isAuthenticated, loading, hasAnyRole } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement if provided
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
};
