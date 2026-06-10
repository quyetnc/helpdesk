import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render button with children text', () => {
    renderWithProviders(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    renderWithProviders(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    renderWithProviders(
      <Button onClick={handleClick} disabled>
        Click
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(0);
  });

  it('should disable button when isLoading is true', () => {
    const handleClick = jest.fn();
    renderWithProviders(
      <Button onClick={handleClick} isLoading>
        Submit
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render loading spinner when isLoading is true', () => {
    renderWithProviders(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct type attribute', () => {
    renderWithProviders(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should default to button type', () => {
    renderWithProviders(<Button>Click</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should apply custom className', () => {
    renderWithProviders(<Button className="custom-class">Click</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should apply variant styles', () => {
    renderWithProviders(
      <Button variant="danger">Delete</Button>
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-600');
  });

  it('should render primary variant by default', () => {
    renderWithProviders(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-200');
  });
});
