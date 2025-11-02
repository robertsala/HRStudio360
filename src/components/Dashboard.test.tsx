import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useAuth } from '../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Dashboard Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfilePicture: jest.fn()
    });
  });

  test('renders dashboard with user welcome message', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Welcome back, Test User')).toBeInTheDocument();
    expect(screen.getByText('Welcome to your HR Dashboard')).toBeInTheDocument();
  });

  test('displays stats cards', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Active Employees')).toBeInTheDocument();
    expect(screen.getByText('247')).toBeInTheDocument();
    expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('shows quick actions section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(screen.getByText('Run Payroll')).toBeInTheDocument();
    expect(screen.getByText('Schedule Review')).toBeInTheDocument();
  });

  test('displays recent activity', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New employee onboarded')).toBeInTheDocument();
    expect(screen.getByText('by Sarah Johnson')).toBeInTheDocument();
  });

  test('shows AI insights section', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Workforce Trends')).toBeInTheDocument();
    expect(screen.getByText('Compliance Alert')).toBeInTheDocument();
  });
});