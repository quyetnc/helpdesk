import { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useTicket } from '../hooks/useTicket';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Button } from './Button';

const VALID_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['ON_HOLD', 'RESOLVED', 'CLOSED'],
  ON_HOLD: ['IN_PROGRESS', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export function TicketDetail({ ticket, currentUser }) {
  const { updateTicketStatus, assignTicket, selfAssignTicket } = useTicket();
  const [loading, setLoading] = useState(false);
  const [newAssignee, setNewAssignee] = useState(ticket.assignee_id || '');

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return;

    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!newAssignee) return;

    setLoading(true);
    try {
      await assignTicket(ticket.id, newAssignee);
      toast.success('Ticket assigned successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to assign ticket';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfAssign = async () => {
    setLoading(true);
    try {
      await selfAssignTicket(ticket.id, currentUser.id);
      toast.success('You have been assigned to this ticket');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to self-assign';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getSLAColor = () => {
    if (!ticket.sla_deadline) return 'text-gray-600';
    const now = new Date();
    const deadline = new Date(ticket.sla_deadline);
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return 'text-red-600 font-semibold';
    if (hoursRemaining < 24) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const createdDate = new Date(ticket.created_at).toLocaleDateString();
  const resolvedDate = ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : null;
  const isAgent = currentUser?.role === 'AGENT' || currentUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const validTransitions = VALID_TRANSITIONS[ticket.status] || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-gray-500 mt-1">#{ticket.id}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <div className="block text-sm font-medium text-gray-600 mb-1">Description</div>
                <p className="text-gray-900">{ticket.description}</p>
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-600 mb-2">Status</div>
                {isAgent && validTransitions.length > 0 ? (
                  <div className="space-y-2">
                    <StatusBadge status={ticket.status} />
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={ticket.status}>{ticket.status}</option>
                      {validTransitions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-600 mb-1">Priority</div>
                <PriorityBadge priority={ticket.priority} />
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-600 mb-1">Created</div>
                <p className="text-gray-900">{createdDate}</p>
              </div>

              {resolvedDate && (
                <div>
                  <div className="block text-sm font-medium text-gray-600 mb-1">Resolved</div>
                  <p className="text-gray-900">{resolvedDate}</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment & SLA</h2>
            <div className="space-y-4">
              <div>
                <div className="block text-sm font-medium text-gray-600 mb-1">Requester</div>
                <p className="text-gray-900">{ticket.requester_name || ticket.requester_id}</p>
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-600 mb-2">Assigned To</div>
                {ticket.assignee_name ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{ticket.assignee_name}</p>
                    {isAdmin && (
                      <span className="text-xs text-gray-500">({ticket.assignee_id})</span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Unassigned</p>
                )}

                {isAgent && !ticket.assignee_id && validTransitions.length > 0 && (
                  <Button
                    onClick={handleSelfAssign}
                    disabled={loading}
                    isLoading={loading}
                    variant="primary"
                    className="mt-2"
                  >
                    Assign to Me
                  </Button>
                )}

                {isAdmin && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="UUID of assignee"
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleAssign}
                      disabled={loading || !newAssignee}
                      isLoading={loading}
                      variant="primary"
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </div>

              {ticket.sla_deadline && (
                <div>
                  <div className="block text-sm font-medium text-gray-600 mb-1">SLA Deadline</div>
                  <p className={getSLAColor()}>
                    {new Date(ticket.sla_deadline).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

TicketDetail.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    resolved_at: PropTypes.string,
    sla_deadline: PropTypes.string.isRequired,
    assignee_id: PropTypes.string,
    assignee_name: PropTypes.string,
    requester_id: PropTypes.string.isRequired,
    requester_name: PropTypes.string.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};
