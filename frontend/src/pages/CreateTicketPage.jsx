import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTicket } from '../hooks/useTicket';
import { TicketForm } from '../components/TicketForm';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTicket } = useTicket();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (ticketData) => {
    setSubmitting(true);

    try {
      const newTicket = await createTicket({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        requester_id: ticketData.requester_id,
      });

      toast.success('Ticket created successfully');
      navigate(`/tickets/${newTicket.id}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create ticket';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Support Ticket</h1>
        <p className="text-gray-600 mt-2">Describe your issue and we&apos;ll get it resolved</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <TicketForm onSubmit={handleSubmit} submitting={submitting} requesterId={user?.id} />
      </div>
    </div>
  );
}
