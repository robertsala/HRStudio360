import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute Component', () => {
  test('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfilePicture: jest.fn()
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('shows access restricted message when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfilePicture: jest.fn()
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.getByText('You need to sign in to access this page. Please sign in to continue.')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfilePicture: jest.fn()
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
  });

  test('renders custom fallback when provided and not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfilePicture: jest.fn()
    });

    render(
      <ProtectedRoute fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});