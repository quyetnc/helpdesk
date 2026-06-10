import { useState } from 'react';
import PropTypes from 'prop-types';
import { z } from 'zod';
import { Button } from './Button';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment must be 2000 characters or less'),
});

export function CommentForm({ onSubmit }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const charCount = body.length;
  const charLimit = 2000;
  const isNearLimit = charCount > charLimit * 0.9;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      commentSchema.parse({ body });
      setSubmitting(true);
      await onSubmit(body);
      setBody('');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Failed to add comment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a Comment</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your comment here..."
        rows="4"
        maxLength="2000"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <div className="flex justify-between items-center mt-3">
        <small className={`${isNearLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
          {charCount} / {charLimit}
        </small>
        <Button type="submit" isLoading={submitting} disabled={submitting || !body.trim()} variant="primary">
          {submitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}

CommentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
