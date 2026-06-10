import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { TicketForm } from './TicketForm';

describe('TicketForm Component', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    submitting: false,
    requesterId: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with all fields', () => {
    renderWithProviders(<TicketForm {...defaultProps} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('should have title input with correct attributes', () => {
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('type', 'text');
    expect(titleInput).toHaveAttribute('maxLength', '200');
    expect(titleInput).toHaveAttribute('placeholder', 'Brief summary of the issue');
  });

  it('should have description textarea with correct attributes', () => {
    renderWithProviders(<TicketForm {...defaultProps} />);

    const descInput = screen.getByLabelText(/description/i);
    expect(descInput).toHaveAttribute('maxLength', '5000');
    expect(descInput).toHaveAttribute('placeholder', 'Detailed description of the issue');
  });

  it('should have priority select with all options', () => {
    renderWithProviders(<TicketForm {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toBeInTheDocument();
    expect(screen.getByText(/🟢 Low/)).toBeInTheDocument();
    expect(screen.getByText(/🟡 Medium/)).toBeInTheDocument();
    expect(screen.getByText(/🟠 High/)).toBeInTheDocument();
    expect(screen.getByText(/🔴 Urgent/)).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    await user.type(titleInput, 'Test issue');
    await user.type(descInput, 'This is a test issue with enough characters');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test issue',
          description: 'This is a test issue with enough characters',
          priority: 'MEDIUM',
          requester_id: 'user-123',
        })
      );
    });
  });

  it('should show validation error for short title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    await user.type(titleInput, 'Bad');
    await user.type(descInput, 'Description that is long enough to pass validation');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    await user.type(titleInput, 'Valid Title');
    await user.type(descInput, 'Short');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
    });
  });

  it('should not call onSubmit on validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    await user.type(titleInput, 'Bad');
    await user.click(submitBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable submit button when submitting', () => {
    renderWithProviders(<TicketForm {...defaultProps} submitting />);

    const submitBtn = screen.getByRole('button', { name: /submitting/i });
    expect(submitBtn).toBeDisabled();
  });

  it('should clear validation errors on input change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/title/i);
    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    await user.type(titleInput, 'Bad');
    await user.click(submitBtn);

    expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();

    await user.type(titleInput, 'Title');

    expect(screen.queryByText(/title must be at least 5 characters/i)).not.toBeInTheDocument();
  });

  it('should use initialData when provided', () => {
    renderWithProviders(
      <TicketForm
        {...defaultProps}
        initialData={{
          title: 'Initial Title',
          description: 'Initial description with enough characters',
          priority: 'HIGH',
        }}
      />
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Initial Title');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Initial description with enough characters');
    expect(screen.getByLabelText(/priority/i)).toHaveValue('HIGH');
  });

  it('should display character count for description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const descInput = screen.getByLabelText(/description/i);
    const testText = 'This is a test description';

    await user.type(descInput, testText);

    expect(screen.getByText(new RegExp(`${testText.length} / 5000`))).toBeInTheDocument();
  });

  it('should allow changing priority', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketForm {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.selectOptions(prioritySelect, 'URGENT');

    expect(prioritySelect).toHaveValue('URGENT');
  });
});
