import PropTypes from 'prop-types';
import { CommentItem } from './CommentItem';

export function CommentThread({ comments }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

CommentThread.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
};
