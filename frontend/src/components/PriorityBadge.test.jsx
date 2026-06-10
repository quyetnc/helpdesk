import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { PriorityBadge } from './PriorityBadge';

describe('PriorityBadge Component', () => {
  it('should render priority text', () => {
    renderWithProviders(<PriorityBadge priority="HIGH" />);
    expect(screen.getByText(/HIGH/)).toBeInTheDocument();
  });

  it('should render correct icon for URGENT priority', () => {
    renderWithProviders(<PriorityBadge priority="URGENT" />);
    const badge = screen.getByText(/URGENT/).closest('span');
    expect(badge.textContent).toContain('🔴');
  });

  it('should render correct icon for HIGH priority', () => {
    renderWithProviders(<PriorityBadge priority="HIGH" />);
    const badge = screen.getByText(/HIGH/).closest('span');
    expect(badge.textContent).toContain('🟠');
  });

  it('should render correct icon for MEDIUM priority', () => {
    renderWithProviders(<PriorityBadge priority="MEDIUM" />);
    const badge = screen.getByText(/MEDIUM/).closest('span');
    expect(badge.textContent).toContain('🟡');
  });

  it('should render correct icon for LOW priority', () => {
    renderWithProviders(<PriorityBadge priority="LOW" />);
    const badge = screen.getByText(/LOW/).closest('span');
    expect(badge.textContent).toContain('🟢');
  });

  it('should render default icon for unknown priority', () => {
    renderWithProviders(<PriorityBadge priority="UNKNOWN" />);
    const badge = screen.getByText(/UNKNOWN/).closest('span');
    expect(badge.textContent).toContain('⚪');
  });

  it('should apply correct colors for URGENT priority', () => {
    renderWithProviders(<PriorityBadge priority="URGENT" />);
    const badge = screen.getByText(/URGENT/).closest('span');
    expect(badge.className).toContain('bg-red-200');
    expect(badge.className).toContain('text-red-900');
  });

  it('should apply correct colors for HIGH priority', () => {
    renderWithProviders(<PriorityBadge priority="HIGH" />);
    const badge = screen.getByText(/HIGH/).closest('span');
    expect(badge.className).toContain('bg-orange-200');
    expect(badge.className).toContain('text-orange-900');
  });

  it('should apply correct colors for MEDIUM priority', () => {
    renderWithProviders(<PriorityBadge priority="MEDIUM" />);
    const badge = screen.getByText(/MEDIUM/).closest('span');
    expect(badge.className).toContain('bg-yellow-200');
    expect(badge.className).toContain('text-yellow-900');
  });

  it('should apply correct colors for LOW priority', () => {
    renderWithProviders(<PriorityBadge priority="LOW" />);
    const badge = screen.getByText(/LOW/).closest('span');
    expect(badge.className).toContain('bg-green-200');
    expect(badge.className).toContain('text-green-900');
  });
});
