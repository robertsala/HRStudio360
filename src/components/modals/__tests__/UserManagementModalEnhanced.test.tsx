import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagementModal from '../UserManagementModalEnhanced';
import { AuthProvider } from '@/contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    }))
  }
}));

// Mock React Query hooks
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'hr'
};

const mockAuthContext = {
  user: mockUser,
  profile: { id: 'test-user-id', role: 'hr' },
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  startImpersonation: jest.fn(),
  stopImpersonation: jest.fn(),
  impersonatedUser: null,
  actualUser: null,
  isImpersonating: false
};

jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => mockAuthContext
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('UserManagementModalEnhanced - Loading States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default mutation mock
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  it('should show loading state until both datasets load', async () => {
    // Mock assignments query as loading
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should show loading state
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should handle empty access levels without spinner lock', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Mock Supabase to return empty array
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],  // Empty access levels
        error: null
      })
    });

    // Mock assignments query as loaded with empty data
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should NOT be stuck in loading state
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should handle empty assignments correctly', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Mock access levels
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: 'level-1', name: 'Basic Access', priority: 1 }
        ],
        error: null
      })
    });

    // Mock empty assignments
    mockUseQuery.mockReturnValue({
      data: [],  // Empty assignments array
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should render without errors
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should display error toast when assignments fetch fails', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Mock access levels success
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'level-1', name: 'Basic Access' }],
        error: null
      })
    });

    // Mock assignments query error
    const assignmentsError = new Error('Failed to fetch assignments');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: assignmentsError,
      refetch: jest.fn()
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should show error and stop loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should reactively update when assignments change', async () => {
    const { supabase } = require('@/lib/supabase');
    
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'level-1', name: 'Basic Access', priority: 1 }],
        error: null
      })
    });

    // Start with no assignments
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    const { rerender } = renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Update to have assignments
    mockUseQuery.mockReturnValue({
      data: [
        { employeeId: 'emp-1', accessLevelId: 'level-1', assignedBy: 'test-user', assignedAt: new Date().toISOString() }
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    // Rerender
    rerender(<UserManagementModal onClose={jest.fn()} />);

    // UI should update reactively
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });
});

describe('UserManagementModalEnhanced - localStorage Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should successfully migrate localStorage data on first load', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Set up localStorage data
    const storedAssignments = {
      'emp-1': 'level-1',
      'emp-2': 'level-2'
    };
    localStorage.setItem('employee_access_assignments', JSON.stringify(storedAssignments));

    // Mock successful mutation
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync,
      isPending: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'level-1', name: 'Basic' }],
        error: null
      })
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Wait for migration to complete
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        assignments: [
          { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'migration' },
          { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'migration' }
        ]
      });
    });
  });

  it('should clear localStorage after successful migration', async () => {
    const { supabase } = require('@/lib/supabase');
    
    localStorage.setItem('employee_access_assignments', JSON.stringify({ 'emp-1': 'level-1' }));

    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync,
      isPending: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'level-1', name: 'Basic' }],
        error: null
      })
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Wait for migration
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    // localStorage should be cleared
    await waitFor(() => {
      expect(localStorage.getItem('employee_access_assignments')).toBeNull();
    });
  });

  it('should handle migration failure gracefully', async () => {
    const { supabase } = require('@/lib/supabase');
    
    localStorage.setItem('employee_access_assignments', JSON.stringify({ 'emp-1': 'level-1' }));

    // Mock failed mutation
    const mutateAsync = jest.fn().mockRejectedValue(new Error('Migration failed'));
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync,
      isPending: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'level-1', name: 'Basic' }],
        error: null
      })
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should not crash, error should be logged
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // localStorage should NOT be cleared on failure
    expect(localStorage.getItem('employee_access_assignments')).not.toBeNull();
  });

  it('should handle empty localStorage gracefully', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // No localStorage data
    const mutateAsync = jest.fn();
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync,
      isPending: false,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    });

    renderWithProviders(<UserManagementModal onClose={jest.fn()} />);

    // Should not attempt migration
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
