import React, { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

/**
 * TicketContext — Ticket state management
 * Manages tickets array, selectedTicket, loading, error, and cache invalidation
 */
export const TicketContext = createContext(null);

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({}); // Simple in-memory cache

  /**
   * Get tickets from cache if available and not expired
   */
  const getCachedData = useCallback((key) => {
    const cached = cache[key];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
    if (isExpired) {
      setCache((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      return null;
    }

    return cached.data;
  }, [cache]);

  /**
   * Store data in cache
   */
  const setCachedData = useCallback((key, data) => {
    setCache((prev) => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now(),
      },
    }));
  }, []);

  /**
   * Invalidate cache for specific key
   */
  const invalidateCache = useCallback((key) => {
    setCache((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  /**
   * Invalidate all cache
   */
  const invalidateAllCache = useCallback(() => {
    setCache({});
  }, []);

  /**
   * Fetch all tickets (AGENT/ADMIN only)
   */
  const fetchTickets = useCallback(
    async (limit = 20, offset = 0, forceRefresh = false) => {
      const cacheKey = `tickets_${limit}_${offset}`;

      // Return cached data if available and not forced refresh
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setTickets(cached.data);
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/tickets', {
          params: { limit, offset },
        });

        setTickets(response.data.data);
        setCachedData(cacheKey, response.data);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch tickets';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData]
  );

  /**
   * Fetch user's own tickets (CUSTOMER only)
   */
  const fetchMyTickets = useCallback(
    async (limit = 20, offset = 0, forceRefresh = false) => {
      const cacheKey = `my_tickets_${limit}_${offset}`;

      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setTickets(cached.data);
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/tickets/my', {
          params: { limit, offset },
        });

        setTickets(response.data.data);
        setCachedData(cacheKey, response.data);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch your tickets';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData]
  );

  /**
   * Fetch ticket by ID
   */
  const fetchTicketById = useCallback(
    async (ticketId, forceRefresh = false) => {
      const cacheKey = `ticket_${ticketId}`;

      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setSelectedTicket(cached);
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/tickets/${ticketId}`);

        setSelectedTicket(response.data);
        setCachedData(cacheKey, response.data);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch ticket';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData]
  );

  /**
   * Create ticket and invalidate list cache
   */
  const createTicket = useCallback(
    async (ticketData) => {
      setError(null);

      try {
        const response = await api.post('/tickets', ticketData);

        // Invalidate cache
        invalidateAllCache();
        setTickets((prev) => [response.data, ...prev]);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to create ticket';
        setError(errorMessage);
        throw err;
      }
    },
    [invalidateAllCache]
  );

  /**
   * Update ticket status
   */
  const updateTicketStatus = useCallback(
    async (ticketId, status) => {
      setError(null);

      try {
        const response = await api.patch(`/tickets/${ticketId}/status`, { status });

        // Update cache
        invalidateCache(`ticket_${ticketId}`);
        setSelectedTicket(response.data);

        // Update in list
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? response.data : t))
        );

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to update ticket status';
        setError(errorMessage);
        throw err;
      }
    },
    [invalidateCache]
  );

  /**
   * Assign ticket
   */
  const assignTicket = useCallback(
    async (ticketId, assigneeId) => {
      setError(null);

      try {
        const response = await api.patch(`/tickets/${ticketId}/assign`, {
          assignee_id: assigneeId,
        });

        // Update cache
        invalidateCache(`ticket_${ticketId}`);
        setSelectedTicket(response.data);

        // Update in list
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? response.data : t))
        );

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to assign ticket';
        setError(errorMessage);
        throw err;
      }
    },
    [invalidateCache]
  );

  /**
   * Self-assign ticket (agent assigns to themselves)
   */
  const selfAssignTicket = useCallback(
    async (ticketId, currentUserId) => {
      return assignTicket(ticketId, currentUserId);
    },
    [assignTicket]
  );

  /**
   * Add comment to ticket
   */
  const addComment = useCallback(
    async (ticketId, body) => {
      setError(null);

      try {
        const response = await api.post('/comments', {
          ticket_id: ticketId,
          body,
        });

        // Invalidate comments cache
        invalidateCache(`comments_${ticketId}`);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to add comment';
        setError(errorMessage);
        throw err;
      }
    },
    [invalidateCache]
  );

  /**
   * Fetch comments for ticket
   */
  const fetchComments = useCallback(
    async (ticketId, limit = 50, offset = 0, forceRefresh = false) => {
      const cacheKey = `comments_${ticketId}_${limit}_${offset}`;

      if (!forceRefresh) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/comments/${ticketId}`, {
          params: { limit, offset },
        });

        setCachedData(cacheKey, response.data);

        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch comments';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData]
  );

  const value = {
    // State
    tickets,
    selectedTicket,
    loading,
    error,

    // Ticket operations
    fetchTickets,
    fetchMyTickets,
    fetchTicketById,
    createTicket,
    updateTicketStatus,
    assignTicket,
    selfAssignTicket,

    // Comment operations
    fetchComments,
    addComment,

    // Cache management
    invalidateCache,
    invalidateAllCache,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
}

TicketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
