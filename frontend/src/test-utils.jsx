import React from 'react';
import PropTypes from 'prop-types';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui,
  renderOptions = {}
) {
  // Create a wrapper with all providers
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <TicketProvider>
            {children}
          </TicketProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock implementation of api client for tests
 */
export const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

/**
 * Mock data generators
 */
export const mockData = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  ticket: (overrides = {}) => ({
    id: 'ticket-123',
    title: 'Test Issue',
    description: 'This is a test issue description',
    priority: 'MEDIUM',
    status: 'OPEN',
    requester_id: 'user-123',
    requester_name: 'Test User',
    assignee_id: null,
    assignee_name: null,
    created_at: '2024-01-01T00:00:00Z',
    resolved_at: null,
    sla_deadline: '2024-01-02T00:00:00Z',
    is_deleted: false,
    ...overrides,
  }),

  comment: (overrides = {}) => ({
    id: 'comment-123',
    ticket_id: 'ticket-123',
    author_id: 'user-123',
    author_name: 'Test User',
    body: 'This is a test comment',
    created_at: '2024-01-01T12:00:00Z',
    is_deleted: false,
    ...overrides,
  }),

  paginatedResponse: (items = [], overrides = {}) => ({
    data: items,
    pagination: {
      limit: 20,
      offset: 0,
      total: items.length,
      ...overrides,
    },
  }),
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
