import PropTypes from 'prop-types';
import { TicketCard } from './TicketCard';

export function TicketList({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-600 text-lg">No tickets to display</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

TicketList.propTypes = {
  tickets: PropTypes.arrayOf(PropTypes.object).isRequired,
};
