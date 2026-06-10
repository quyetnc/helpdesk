import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * useTickets hook — Fetch and manage tickets
 * Returns: { tickets, loading, error, fetchTickets, fetchMyTickets, createTicket }
 */
export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(
    async (limit = 20, offset = 0) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/tickets', {
          params: { limit, offset },
        });
        setTickets(response.data.data);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch tickets';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchMyTickets = useCallback(
    async (limit = 20, offset = 0) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/tickets/my', {
          params: { limit, offset },
        });
        setTickets(response.data.data);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch your tickets';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createTicket = useCallback(async (ticketData) => {
    setError(null);

    try {
      const response = await api.post('/tickets', ticketData);
      setTickets((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create ticket';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    fetchMyTickets,
    createTicket,
  };
}
