import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  it('should render status text', () => {
    renderWithProviders(<StatusBadge status="OPEN" />);
    expect(screen.getByText(/OPEN/)).toBeInTheDocument();
  });

  it('should render correct icon for OPEN status', () => {
    renderWithProviders(<StatusBadge status="OPEN" />);
    const badge = screen.getByText(/OPEN/).closest('span');
    expect(badge.textContent).toContain('📋');
  });

  it('should render correct icon for IN_PROGRESS status', () => {
    renderWithProviders(<StatusBadge status="IN_PROGRESS" />);
    const badge = screen.getByText(/IN_PROGRESS/).closest('span');
    expect(badge.textContent).toContain('⏳');
  });

  it('should render correct icon for RESOLVED status', () => {
    renderWithProviders(<StatusBadge status="RESOLVED" />);
    const badge = screen.getByText(/RESOLVED/).closest('span');
    expect(badge.textContent).toContain('✅');
  });

  it('should render correct icon for CLOSED status', () => {
    renderWithProviders(<StatusBadge status="CLOSED" />);
    const badge = screen.getByText(/CLOSED/).closest('span');
    expect(badge.textContent).toContain('🔒');
  });

  it('should render default icon for unknown status', () => {
    renderWithProviders(<StatusBadge status="UNKNOWN" />);
    const badge = screen.getByText(/UNKNOWN/).closest('span');
    expect(badge.textContent).toContain('❓');
  });

  it('should apply correct colors for OPEN status', () => {
    renderWithProviders(<StatusBadge status="OPEN" />);
    const badge = screen.getByText(/OPEN/).closest('span');
    expect(badge.className).toContain('bg-gray-200');
    expect(badge.className).toContain('text-gray-900');
  });

  it('should apply correct colors for IN_PROGRESS status', () => {
    renderWithProviders(<StatusBadge status="IN_PROGRESS" />);
    const badge = screen.getByText(/IN_PROGRESS/).closest('span');
    expect(badge.className).toContain('bg-blue-200');
    expect(badge.className).toContain('text-blue-900');
  });

  it('should apply correct colors for RESOLVED status', () => {
    renderWithProviders(<StatusBadge status="RESOLVED" />);
    const badge = screen.getByText(/RESOLVED/).closest('span');
    expect(badge.className).toContain('bg-green-200');
    expect(badge.className).toContain('text-green-900');
  });

  it('should apply correct colors for CLOSED status', () => {
    renderWithProviders(<StatusBadge status="CLOSED" />);
    const badge = screen.getByText(/CLOSED/).closest('span');
    expect(badge.className).toContain('bg-slate-200');
    expect(badge.className).toContain('text-slate-900');
  });
});
