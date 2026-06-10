import { useContext } from 'react';
import { TicketContext } from '../context/TicketContext';

/**
 * useTicket hook — Access ticket context anywhere
 * Returns all ticket operations and state
 */
export function useTicket() {
  const context = useContext(TicketContext);

  if (!context) {
    throw new Error('useTicket must be used within <TicketProvider>');
  }

  return context;
}
