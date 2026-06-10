import React, { createContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

/**
 * AuthContext — Authentication state management
 * Manages user object, accessToken, and login/logout flow
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        setAccessToken(token);
        setUser(JSON.parse(userJson));
        // Set token in API default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Failed to restore auth state:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  /**
   * Login with email and password
   * Returns accessToken and user object on success
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      const { accessToken: token, user: userData } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setAccessToken(token);
      setUser(userData);

      // Set token in API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { accessToken: token, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout and clear auth state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!accessToken && !!user;

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  /**
   * Check if user has any of the given roles
   */
  const hasAnyRole = useCallback(
    (roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    accessToken,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
