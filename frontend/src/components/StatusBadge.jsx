import PropTypes from 'prop-types';

export function StatusBadge({ status }) {
  const statusColors = {
    OPEN: 'bg-gray-200 text-gray-900',
    IN_PROGRESS: 'bg-blue-200 text-blue-900',
    RESOLVED: 'bg-green-200 text-green-900',
    CLOSED: 'bg-slate-200 text-slate-900',
  };

  const statusIcons = {
    OPEN: '📋',
    IN_PROGRESS: '⏳',
    RESOLVED: '✅',
    CLOSED: '🔒',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-200 text-gray-900'}`}>
      {statusIcons[status] || '❓'} {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
