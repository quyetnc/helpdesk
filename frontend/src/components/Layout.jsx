import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Layout — Sidebar navigation + main content area
 * Role-based navigation: CUSTOMER sees "My Tickets" + "New Ticket"
 * AGENT/ADMIN sees "Dashboard"
 */
export function Layout({ children }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCustomer = hasRole('CUSTOMER');
  const isAgent = hasRole('AGENT');
  const isAdmin = hasRole('ADMIN');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col shadow-lg">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Support Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Ticket System</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {isCustomer && (
            <>
              <NavLink
                to="/my-tickets"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`
                }
              >
                📋 My Tickets
              </NavLink>
              <NavLink
                to="/create-ticket"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`
                }
              >
                ➕ New Ticket
              </NavLink>
            </>
          )}

          {(isAgent || isAdmin) && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              📊 Dashboard
            </NavLink>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-brand text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            👤 Profile
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            🚪 Logout
          </button>
          <p className="text-slate-400 text-xs text-center mt-2">
            Logged in as{' '}
            <span className="font-semibold text-white">{user?.email}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
