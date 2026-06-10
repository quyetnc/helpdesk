import { screen } from '@testing-library/react';
import { renderWithProviders, mockData } from '../test-utils';
import { TicketList } from './TicketList';

describe('TicketList Component', () => {
  it('should render empty state when no tickets', () => {
    renderWithProviders(<TicketList tickets={[]} />);

    expect(screen.getByText(/no tickets to display/i)).toBeInTheDocument();
  });

  it('should render empty state message with icon', () => {
    renderWithProviders(<TicketList tickets={[]} />);

    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText(/no tickets to display/i)).toBeInTheDocument();
  });

  it('should render single ticket', () => {
    const tickets = [mockData.ticket()];
    renderWithProviders(<TicketList tickets={tickets} />);

    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });

  it('should render multiple tickets', () => {
    const tickets = [
      mockData.ticket({ title: 'First Issue', id: 'ticket-1' }),
      mockData.ticket({ title: 'Second Issue', id: 'ticket-2' }),
      mockData.ticket({ title: 'Third Issue', id: 'ticket-3' }),
    ];
    renderWithProviders(<TicketList tickets={tickets} />);

    expect(screen.getByText('First Issue')).toBeInTheDocument();
    expect(screen.getByText('Second Issue')).toBeInTheDocument();
    expect(screen.getByText('Third Issue')).toBeInTheDocument();
  });

  it('should not render empty state when tickets provided', () => {
    const tickets = [mockData.ticket()];
    renderWithProviders(<TicketList tickets={tickets} />);

    expect(screen.queryByText(/no tickets to display/i)).not.toBeInTheDocument();
  });

  it('should handle null tickets gracefully', () => {
    renderWithProviders(<TicketList tickets={null} />);

    expect(screen.getByText(/no tickets to display/i)).toBeInTheDocument();
  });

  it('should render tickets in a grid', () => {
    const tickets = [
      mockData.ticket({ id: 'ticket-1' }),
      mockData.ticket({ id: 'ticket-2' }),
    ];
    const { container } = renderWithProviders(<TicketList tickets={tickets} />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });
});
