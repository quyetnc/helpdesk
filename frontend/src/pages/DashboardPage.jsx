import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTicket } from '../hooks/useTicket';
import { TicketList } from '../components/TicketList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { tickets, loading, error, fetchTickets } = useTicket();
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => {
    if (hasRole('AGENT') || hasRole('ADMIN')) {
      fetchTickets(limit, offset);
    }
  }, [limit, offset, fetchTickets, hasRole]);

  const filteredTickets = tickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    return true;
  });

  const clearFilters = () => {
    setFilters({ status: '', priority: '' });
  };

  const hasActiveFilters = filters.status || filters.priority;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {user?.email}</p>
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
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-900 mb-2">Status</div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-900 mb-2">Priority</div>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="ghost" className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          <TicketList tickets={filteredTickets} />

          {filteredTickets.length > 0 && (
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
