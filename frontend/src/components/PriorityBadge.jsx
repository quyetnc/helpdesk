import PropTypes from 'prop-types';

export function PriorityBadge({ priority }) {
  const priorityColors = {
    URGENT: 'bg-red-200 text-red-900',
    HIGH: 'bg-orange-200 text-orange-900',
    MEDIUM: 'bg-yellow-200 text-yellow-900',
    LOW: 'bg-green-200 text-green-900',
  };

  const priorityIcons = {
    URGENT: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[priority] || 'bg-gray-200 text-gray-900'}`}>
      {priorityIcons[priority] || '⚪'} {priority}
    </span>
  );
}

PriorityBadge.propTypes = {
  priority: PropTypes.string.isRequired,
};
