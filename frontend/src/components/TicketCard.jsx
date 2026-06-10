import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

export function TicketCard({ ticket }) {
  const createdDate = new Date(ticket.created_at).toLocaleDateString();

  return (
    <Link to={`/tickets/${ticket.id}`} className="block">
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{ticket.title}</h3>
          <PriorityBadge priority={ticket.priority} />
        </div>

        <p className="text-sm text-gray-500 mb-3">#{ticket.id}</p>
        <p className="text-gray-700 mb-4 line-clamp-2">{ticket.description}</p>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Created: {createdDate}</span>
            <StatusBadge status={ticket.status} />
          </div>

          {ticket.assignee_id && (
            <div className="text-sm text-gray-600">
              Assigned: {ticket.assignee_name || ticket.assignee_id}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

TicketCard.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    assignee_id: PropTypes.string,
    assignee_name: PropTypes.string,
  }).isRequired,
};
