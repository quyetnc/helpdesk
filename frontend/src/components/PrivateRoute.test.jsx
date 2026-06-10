import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { PrivateRoute } from './PrivateRoute';
import { AuthContext } from '../context/AuthContext';

describe('PrivateRoute Component', () => {
  const TestComponent = () => <div>Protected Content</div>;

  it('should render loading state initially', () => {
    const authValue = {
      isAuthenticated: false,
      loading: true,
      hasAnyRole: jest.fn(),
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render children when authenticated and no role requirement', () => {
    const authValue = {
      isAuthenticated: true,
      loading: false,
      hasAnyRole: jest.fn(() => true),
      user: { id: 'user-123', role: 'CUSTOMER' },
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children when authenticated with required role', () => {
    const authValue = {
      isAuthenticated: true,
      loading: false,
      hasAnyRole: jest.fn(() => true),
      user: { id: 'user-123', role: 'AGENT' },
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute requiredRoles={['AGENT', 'ADMIN']}>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should check hasAnyRole with provided roles', () => {
    const mockHasAnyRole = jest.fn(() => true);
    const authValue = {
      isAuthenticated: true,
      loading: false,
      hasAnyRole: mockHasAnyRole,
      user: { id: 'user-123', role: 'AGENT' },
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute requiredRoles={['AGENT', 'ADMIN']}>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(mockHasAnyRole).toHaveBeenCalledWith(['AGENT', 'ADMIN']);
  });

  it('should navigate to login when not authenticated', () => {
    const authValue = {
      isAuthenticated: false,
      loading: false,
      hasAnyRole: jest.fn(),
      user: null,
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should navigate to home when user lacks required role', () => {
    const authValue = {
      isAuthenticated: true,
      loading: false,
      hasAnyRole: jest.fn(() => false),
      user: { id: 'user-123', role: 'CUSTOMER' },
    };

    renderWithProviders(
      <AuthContext.Provider value={authValue}>
        <PrivateRoute requiredRoles={['AGENT', 'ADMIN']}>
          <TestComponent />
        </PrivateRoute>
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
