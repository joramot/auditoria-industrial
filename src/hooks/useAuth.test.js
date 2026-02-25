// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockOnAuthChange  = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('../services/auth/authService', () => ({
  onAuthChange:    (...args) => mockOnAuthChange(...args),
  getCurrentUser:  (...args) => mockGetCurrentUser(...args),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { useAuth, useCurrentUser, useIsAuthenticated } from './useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNAUTH_STATE = { isAuthenticated: false, user: null };
const AUTH_STATE   = {
  isAuthenticated: true,
  user: { uid: 'uid-123', email: 'user@gmail.com', displayName: 'Juan' },
};

/** Makes onAuthChange call the callback immediately and return an unsubscribe fn. */
const mockAuthState = (state) => {
  mockOnAuthChange.mockImplementation((callback) => {
    callback(state);
    return jest.fn(); // unsubscribe
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUser.mockReturnValue(null);
});

// ─── useAuth ──────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('starts in loading state before auth is resolved', () => {
    // onAuthChange never fires → hook stays loading
    mockOnAuthChange.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('reflects unauthenticated state after callback fires', () => {
    mockAuthState(UNAUTH_STATE);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('reflects authenticated state after callback fires', () => {
    mockAuthState(AUTH_STATE);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(AUTH_STATE.user);
  });

  it('updates state when auth changes from unauth to auth', () => {
    let capturedCallback;
    mockOnAuthChange.mockImplementation((cb) => {
      capturedCallback = cb;
      cb(UNAUTH_STATE);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);

    act(() => capturedCallback(AUTH_STATE));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.uid).toBe('uid-123');
  });

  it('calls the unsubscribe function on unmount', () => {
    const unsubscribe = jest.fn();
    mockOnAuthChange.mockImplementation((callback) => {
      callback(UNAUTH_STATE);
      return unsubscribe;
    });

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

// ─── useCurrentUser ───────────────────────────────────────────────────────────

describe('useCurrentUser', () => {
  it('initializes with the current synchronous user', () => {
    mockGetCurrentUser.mockReturnValue(AUTH_STATE.user);
    mockAuthState(AUTH_STATE);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(AUTH_STATE.user);
  });

  it('returns null when no user is signed in', () => {
    mockGetCurrentUser.mockReturnValue(null);
    mockAuthState(UNAUTH_STATE);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeNull();
  });

  it('updates when auth state changes', () => {
    let capturedCallback;
    mockGetCurrentUser.mockReturnValue(null);
    mockOnAuthChange.mockImplementation((cb) => {
      capturedCallback = cb;
      cb(UNAUTH_STATE);
      return jest.fn();
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current).toBeNull();

    act(() => capturedCallback(AUTH_STATE));

    expect(result.current).toEqual(AUTH_STATE.user);
  });
});

// ─── useIsAuthenticated ───────────────────────────────────────────────────────

describe('useIsAuthenticated', () => {
  it('returns false when not authenticated', () => {
    mockAuthState(UNAUTH_STATE);

    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current).toBe(false);
  });

  it('returns true when authenticated', () => {
    mockGetCurrentUser.mockReturnValue(AUTH_STATE.user);
    mockAuthState(AUTH_STATE);

    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current).toBe(true);
  });

  it('updates from false to true on sign-in', () => {
    let capturedCallback;
    mockOnAuthChange.mockImplementation((cb) => {
      capturedCallback = cb;
      cb(UNAUTH_STATE);
      return jest.fn();
    });

    const { result } = renderHook(() => useIsAuthenticated());
    expect(result.current).toBe(false);

    act(() => capturedCallback(AUTH_STATE));

    expect(result.current).toBe(true);
  });
});
