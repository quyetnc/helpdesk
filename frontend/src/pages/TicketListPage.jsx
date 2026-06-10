import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTicket } from '../hooks/useTicket';
import { TicketList } from '../components/TicketList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

export function TicketListPage() {
  const { user } = useAuth();
  const { tickets, loading, error, fetchMyTickets } = useTicket();
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchMyTickets(limit, offset);
  }, [limit, offset, fetchMyTickets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="text-gray-600 mt-2">Showing tickets created by {user?.email}</p>
        </div>
        <Link to="/create-ticket">
          <Button variant="primary">+ Create Ticket</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <TicketList tickets={tickets} />

          {tickets.length > 0 && (
            <div className="flex justify-center items-center gap-4 py-6">
              <Button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                variant="default"
              >
                ← Previous
              </Button>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                Page {Math.floor(offset / limit) + 1}
              </span>
              <Button
                onClick={() => setOffset(offset + limit)}
                disabled={tickets.length < limit}
                variant="default"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
