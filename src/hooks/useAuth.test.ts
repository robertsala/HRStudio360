import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  test('initializes with no user when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('initializes with user from localStorage', () => {
    const mockUser = { email: 'test@example.com', name: 'test' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  test('signs in user successfully', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn('test@example.com', 'demo123');
    });

    expect(result.current.user).toEqual({
      email: 'test@example.com',
      name: 'test'
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mockUser',
      JSON.stringify({ email: 'test@example.com', name: 'test' })
    );
  });

  test('signs out user successfully', () => {
    const mockUser = { email: 'test@example.com', name: 'test' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mockUser');
  });
});