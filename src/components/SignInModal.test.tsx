import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInModal from './SignInModal';

describe('SignInModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSignIn = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSignIn.mockClear();
  });

  test('renders sign in modal when open', () => {
    render(
      <SignInModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Welcome back to HRStudio360')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <SignInModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  test('calls onClose when X button is clicked', () => {
    render(
      <SignInModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows error for invalid credentials', async () => {
    render(
      <SignInModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials. Try password: demo123')).toBeInTheDocument();
    });

    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  test('successfully signs in with correct credentials', async () => {
    render(
      <SignInModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'demo123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSignIn).toHaveBeenCalledWith('test@example.com', 'demo123');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('toggles password visibility', () => {
    render(
      <SignInModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSignIn={mockOnSignIn} 
      />
    );

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});