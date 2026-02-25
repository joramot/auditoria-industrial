// ─── Module mocks (hoisted by Jest) ──────────────────────────────────────────

jest.mock('../firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
}));

jest.mock('../migration/roleService', () => ({
  createOrUpdateUserRole: jest.fn().mockResolvedValue(true),
  ROLES: {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    AUDITOR: 'auditor',
    VISUALIZADOR: 'visualizador',
  },
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInAnonymously: jest.fn(),
  sendEmailVerification: jest.fn(),
  reload: jest.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import {
  login,
  register,
  logout,
  resetPassword,
  getCurrentUser,
  resendVerificationEmail,
  checkEmailVerified,
  onAuthChange,
  loginAnonymously,
} from './authService';

import { auth } from '../firebase/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { createOrUpdateUserRole } from '../migration/roleService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_EMAIL    = 'user@gmail.com';
const VALID_PASSWORD = 'MyStr0ng!Pass';
const VALID_NAME     = 'Juan Pérez';

const makeFbUser = (overrides = {}) => ({
  uid: 'uid-123',
  email: VALID_EMAIL,
  displayName: VALID_NAME,
  isAnonymous: false,
  emailVerified: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  auth.currentUser = null;
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns error when email is invalid', async () => {
    const result = await login('not-an-email', VALID_PASSWORD);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('returns error when password is empty', async () => {
    const result = await login(VALID_EMAIL, '');
    expect(result.success).toBe(false);
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('calls Firebase signInWithEmailAndPassword with sanitized email', async () => {
    const fbUser = makeFbUser();
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });

    await login('User@Gmail.COM', VALID_PASSWORD);

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'user@gmail.com',
      VALID_PASSWORD
    );
  });

  it('returns success with user data on valid credentials', async () => {
    const fbUser = makeFbUser();
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });

    const result = await login(VALID_EMAIL, VALID_PASSWORD);

    expect(result.success).toBe(true);
    expect(result.user.uid).toBe('uid-123');
    expect(result.user.email).toBe(VALID_EMAIL);
  });

  it('returns generic error for auth/invalid-credential', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });

    const result = await login(VALID_EMAIL, VALID_PASSWORD);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/email o contraseña/i);
  });

  it('returns disabled-account error for auth/user-disabled', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/user-disabled',
    });

    const result = await login(VALID_EMAIL, VALID_PASSWORD);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/deshabilitada/i);
  });

  it('returns too-many-requests message for auth/too-many-requests', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/too-many-requests',
    });

    const result = await login(VALID_EMAIL, VALID_PASSWORD);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/demasiados/i);
  });

  it('returns generic error for unknown error codes', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/network-request-failed' });

    const result = await login(VALID_EMAIL, VALID_PASSWORD);

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns isRateLimited flag when rate limited', async () => {
    // Exhaust rate limit attempts
    const RATE_EMAIL = 'ratelimited-login@gmail.com';
    for (let i = 0; i < 5; i++) {
      signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
      await login(RATE_EMAIL, VALID_PASSWORD);
    }
    jest.clearAllMocks();

    const result = await login(RATE_EMAIL, VALID_PASSWORD);
    expect(result.success).toBe(false);
    expect(result.isRateLimited).toBe(true);
  });
});

// ─── register ────────────────────────────────────────────────────────────────

describe('register', () => {
  it('returns error for invalid email', async () => {
    const result = await register('bad-email', VALID_PASSWORD, VALID_NAME);
    expect(result.success).toBe(false);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('returns error for weak password', async () => {
    const result = await register(VALID_EMAIL, 'weak', VALID_NAME);
    expect(result.success).toBe(false);
    expect(result.allErrors).toBeDefined();
  });

  it('returns error for invalid name', async () => {
    const result = await register(VALID_EMAIL, VALID_PASSWORD, 'J0hn');
    expect(result.success).toBe(false);
  });

  it('creates user in Firebase on valid input', async () => {
    const fbUser = makeFbUser({ emailVerified: false });
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });
    sendEmailVerification.mockResolvedValueOnce();

    await register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      VALID_EMAIL,
      VALID_PASSWORD
    );
  });

  it('updates profile with sanitized display name', async () => {
    const fbUser = makeFbUser();
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });
    updateProfile.mockResolvedValueOnce();
    sendEmailVerification.mockResolvedValueOnce();

    await register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

    expect(updateProfile).toHaveBeenCalledWith(fbUser, { displayName: VALID_NAME });
  });

  it('returns success with requiresVerification flag', async () => {
    const fbUser = makeFbUser();
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });
    sendEmailVerification.mockResolvedValueOnce();

    const result = await register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.user.emailVerified).toBe(false);
  });

  it('handles auth/email-already-in-use error', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    });

    const result = await register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ya tiene una cuenta/i);
  });

  it('still succeeds if email verification fails', async () => {
    const fbUser = makeFbUser();
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser });
    sendEmailVerification.mockRejectedValueOnce(new Error('network'));

    const result = await register(VALID_EMAIL, VALID_PASSWORD, VALID_NAME);

    expect(result.success).toBe(true);
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('calls Firebase signOut', async () => {
    signOut.mockResolvedValueOnce();
    await logout();
    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it('returns success', async () => {
    signOut.mockResolvedValueOnce();
    const result = await logout();
    expect(result.success).toBe(true);
  });

  it('returns error on failure', async () => {
    signOut.mockRejectedValueOnce(new Error('network'));
    const result = await logout();
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ─── resetPassword ───────────────────────────────────────────────────────────

describe('resetPassword', () => {
  it('returns error for invalid email', async () => {
    const result = await resetPassword('not-valid');
    expect(result.success).toBe(false);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('calls Firebase sendPasswordResetEmail', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce();
    await resetPassword(VALID_EMAIL);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, VALID_EMAIL);
  });

  it('always returns success message (security: never reveal if email exists)', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce();
    const result = await resetPassword(VALID_EMAIL);
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it('returns success even when Firebase throws (anti-enumeration)', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(new Error('not found'));
    const result = await resetPassword(VALID_EMAIL);
    expect(result.success).toBe(true);
  });
});

// ─── getCurrentUser ───────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  it('returns null when no user is signed in', () => {
    auth.currentUser = null;
    expect(getCurrentUser()).toBeNull();
  });

  it('returns user data when a user is signed in', () => {
    auth.currentUser = makeFbUser();
    const user = getCurrentUser();
    expect(user).not.toBeNull();
    expect(user.uid).toBe('uid-123');
    expect(user.email).toBe(VALID_EMAIL);
  });

  it('falls back to email when displayName is null', () => {
    auth.currentUser = makeFbUser({ displayName: null });
    const user = getCurrentUser();
    expect(user.displayName).toBe(VALID_EMAIL);
  });
});

// ─── resendVerificationEmail ──────────────────────────────────────────────────

describe('resendVerificationEmail', () => {
  it('returns error when no user is signed in', async () => {
    auth.currentUser = null;
    const result = await resendVerificationEmail();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no hay usuario/i);
  });

  it('returns error if email is already verified', async () => {
    auth.currentUser = makeFbUser({ emailVerified: true });
    const result = await resendVerificationEmail();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ya está verificado/i);
  });

  it('sends verification email when user is unverified', async () => {
    auth.currentUser = makeFbUser({ emailVerified: false });
    sendEmailVerification.mockResolvedValueOnce();

    const result = await resendVerificationEmail();

    expect(sendEmailVerification).toHaveBeenCalledWith(auth.currentUser);
    expect(result.success).toBe(true);
  });

  it('handles auth/too-many-requests', async () => {
    auth.currentUser = makeFbUser({ emailVerified: false });
    sendEmailVerification.mockRejectedValueOnce({ code: 'auth/too-many-requests' });

    const result = await resendVerificationEmail();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/demasiados/i);
  });
});

// ─── checkEmailVerified ───────────────────────────────────────────────────────

describe('checkEmailVerified', () => {
  it('returns verified: false when no user is signed in', async () => {
    auth.currentUser = null;
    const result = await checkEmailVerified();
    expect(result.verified).toBe(false);
  });

  it('reloads the user and returns verification state', async () => {
    const fbUser = makeFbUser({ emailVerified: true });
    auth.currentUser = fbUser;
    reload.mockResolvedValueOnce();

    const result = await checkEmailVerified();

    expect(reload).toHaveBeenCalledWith(fbUser);
    expect(result.verified).toBe(true);
    expect(result.email).toBe(VALID_EMAIL);
  });

  it('returns error object when reload fails', async () => {
    auth.currentUser = makeFbUser();
    reload.mockRejectedValueOnce(new Error('network'));

    const result = await checkEmailVerified();

    expect(result.verified).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ─── onAuthChange ─────────────────────────────────────────────────────────────

describe('onAuthChange', () => {
  it('calls callback with isAuthenticated: true when user signs in', async () => {
    const fbUser = makeFbUser();
    createOrUpdateUserRole.mockResolvedValueOnce(true);

    // Simulate onAuthStateChanged calling back with a user
    onAuthStateChanged.mockImplementation((authObj, callback) => {
      callback(fbUser);
      return jest.fn(); // unsubscribe
    });

    const callback = jest.fn();
    onAuthChange(callback);

    // Wait for async createOrUpdateUserRole to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: true,
        user: expect.objectContaining({ uid: 'uid-123' }),
      })
    );
  });

  it('calls callback with isAuthenticated: false when no user', () => {
    onAuthStateChanged.mockImplementation((authObj, callback) => {
      callback(null);
      return jest.fn();
    });

    const callback = jest.fn();
    onAuthChange(callback);

    expect(callback).toHaveBeenCalledWith({ isAuthenticated: false, user: null });
  });

  it('returns the unsubscribe function', () => {
    const unsubscribe = jest.fn();
    onAuthStateChanged.mockReturnValueOnce(unsubscribe);

    const result = onAuthChange(jest.fn());

    expect(result).toBe(unsubscribe);
  });
});

// ─── loginAnonymously ────────────────────────────────────────────────────────

describe('loginAnonymously', () => {
  it('calls Firebase signInAnonymously', async () => {
    const fbUser = { uid: 'anon-uid', isAnonymous: true };
    signInAnonymously.mockResolvedValueOnce({ user: fbUser });

    await loginAnonymously();

    expect(signInAnonymously).toHaveBeenCalledWith(auth);
  });

  it('returns success with anonymous user data', async () => {
    const fbUser = { uid: 'anon-uid', isAnonymous: true };
    signInAnonymously.mockResolvedValueOnce({ user: fbUser });

    const result = await loginAnonymously();

    expect(result.success).toBe(true);
    expect(result.user.isAnonymous).toBe(true);
    expect(result.user.email).toBeNull();
  });

  it('returns error when signInAnonymously fails', async () => {
    signInAnonymously.mockRejectedValueOnce(new Error('not enabled'));

    const result = await loginAnonymously();

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
