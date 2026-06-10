import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTicket } from '../hooks/useTicket';
import { TicketDetail } from '../components/TicketDetail';
import { CommentThread } from '../components/CommentThread';
import { CommentForm } from '../components/CommentForm';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function TicketDetailPage() {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTicket, loading, error, fetchTicketById, fetchComments, addComment } = useTicket();
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const commentsData = await fetchComments(ticketId, 50, 0);
      setComments(commentsData?.data || []);
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketById(ticketId);
    loadComments();
  }, [ticketId, fetchTicketById]);

  const handleAddComment = async (body) => {
    try {
      await addComment(ticketId, body);
      toast.success('Comment added successfully');
      await loadComments();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ {error}
      </div>
    );
  }
  if (!selectedTicket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition"
      >
        ← Back
      </button>

      <TicketDetail ticket={selectedTicket} currentUser={user} />

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Comments ({comments.length})</h2>

        {commentsLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <CommentThread comments={comments} />

            {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <CommentForm onSubmit={handleAddComment} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
