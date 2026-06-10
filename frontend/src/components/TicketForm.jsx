import { useState } from 'react';
import PropTypes from 'prop-types';
import { z } from 'zod';
import { Button } from './Button';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be 5000 characters or less'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export function TicketForm({ onSubmit, submitting = false, requesterId, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    try {
      ticketSchema.parse(formData);
      onSubmit({ ...formData, requester_id: requesterId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Brief summary of the issue"
          maxLength="200"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the issue"
          rows="6"
          maxLength="5000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        <p className="mt-1 text-sm text-gray-600">{formData.description.length} / 5000</p>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-900 mb-2">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="LOW">🟢 Low</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="HIGH">🟠 High</option>
          <option value="URGENT">🔴 Urgent</option>
        </select>
      </div>

      <Button type="submit" disabled={submitting} isLoading={submitting} variant="primary">
        {submitting ? 'Submitting...' : 'Submit Ticket'}
      </Button>
    </form>
  );
}

TicketForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  requesterId: PropTypes.string,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    priority: PropTypes.string,
  }),
};
