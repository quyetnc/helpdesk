import PropTypes from 'prop-types';

export function CommentItem({ comment }) {
  const createdDate = new Date(comment.created_at).toLocaleDateString();
  const createdTime = new Date(comment.created_at).toLocaleTimeString();
  const authorName = comment.author_name || 'Anonymous';
  const initials = authorName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <strong className="text-gray-900">{authorName}</strong>
            <span className="text-sm text-gray-500">
              {createdDate} at {createdTime}
            </span>
          </div>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">
            {comment.body}
          </p>
        </div>
      </div>
    </div>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    author_name: PropTypes.string,
    body: PropTypes.string.isRequired,
  }).isRequired,
};
