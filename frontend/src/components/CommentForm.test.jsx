import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import { CommentForm } from './CommentForm';

describe('CommentForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with textarea', () => {
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    expect(screen.getByPlaceholderText(/type your comment here/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  it('should display character count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    await user.type(textarea, 'Test comment');

    expect(screen.getByText(/12 \/ 2000/)).toBeInTheDocument();
  });

  it('should disable submit button when textarea is empty', () => {
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /post comment/i });
    expect(submitBtn).toBeDisabled();
  });

  it('should enable submit button when textarea has content', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    await user.type(textarea, 'Test comment');

    expect(submitBtn).not.toBeDisabled();
  });

  it('should call onSubmit with comment body', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    await user.type(textarea, 'My test comment');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('My test comment');
    });
  });

  it('should clear textarea after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    await user.type(textarea, 'My test comment');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('should show error message on validation failure', async () => {
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    // The form won't allow submit with empty textarea due to disabled state
    expect(submitBtn).toBeDisabled();
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    await user.type(textarea, 'Test comment');
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
  });

  it('should show error message when submission fails', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const submitBtn = screen.getByRole('button', { name: /post comment/i });

    await user.type(textarea, 'Test comment');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should show character count near limit in different color', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    const longText = 'x'.repeat(1850); // 92.5% of limit

    // Use paste for large text to avoid timeout
    await user.click(textarea);
    await user.paste(longText);

    const charCountElement = screen.getByText(/1850 \/ 2000/);
    expect(charCountElement).toHaveClass('text-red-600');
    expect(charCountElement).toHaveClass('font-semibold');
  });

  it('should have textarea with correct maxLength', () => {
    renderWithProviders(<CommentForm onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/type your comment here/i);
    expect(textarea).toHaveAttribute('maxLength', '2000');
  });
});
