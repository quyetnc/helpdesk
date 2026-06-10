import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth hook — Access auth context anywhere
 * Returns: { user, accessToken, loading, error, login, logout, isAuthenticated, hasRole, hasAnyRole }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }

  return context;
}
