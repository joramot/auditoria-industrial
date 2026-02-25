import {
  sanitizeInput,
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  validatePasswordStrength,
  validateLoginInput,
  validateRegisterInput,
  checkRateLimit,
  recordLoginAttempt,
  resetLoginAttempts,
  escapeHtml,
  getSecurityConfig,
} from './securityService';

// ─── sanitizeInput ────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('returns empty string for non-string values', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
    expect(sanitizeInput({})).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('removes control characters', () => {
    expect(sanitizeInput('he\u0000llo')).toBe('hello');
    expect(sanitizeInput('he\u001Fllo')).toBe('hello');
    expect(sanitizeInput('he\u007Fllo')).toBe('hello');
  });

  it('removes < and > characters', () => {
    expect(sanitizeInput('<script>')).toBe('script');
    expect(sanitizeInput('a<b>c')).toBe('abc');
  });

  it('strips javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('strips inline event handler patterns', () => {
    expect(sanitizeInput('onerror=alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('onclick=foo()')).toBe('foo()');
  });

  it('returns clean string unchanged', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });
});

// ─── sanitizeEmail ───────────────────────────────────────────────────────────

describe('sanitizeEmail', () => {
  it('returns error for null / empty input', () => {
    expect(sanitizeEmail(null).isValid).toBe(false);
    expect(sanitizeEmail('').isValid).toBe(false);
    expect(sanitizeEmail(undefined).isValid).toBe(false);
  });

  it('returns error for non-string input', () => {
    expect(sanitizeEmail(42).isValid).toBe(false);
  });

  it('returns error when email exceeds max length', () => {
    const longEmail = 'a'.repeat(250) + '@gmail.com';
    expect(sanitizeEmail(longEmail).isValid).toBe(false);
  });

  it('validates a correct gmail address', () => {
    const result = sanitizeEmail('user@gmail.com');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('user@gmail.com');
    expect(result.error).toBeNull();
  });

  it('lowercases the email', () => {
    const result = sanitizeEmail('User@GMAIL.COM');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('user@gmail.com');
  });

  it('accepts other known domains', () => {
    expect(sanitizeEmail('u@outlook.com').isValid).toBe(true);
    expect(sanitizeEmail('u@hotmail.com').isValid).toBe(true);
    expect(sanitizeEmail('u@protonmail.com').isValid).toBe(true);
  });

  it('accepts custom corporate domains with valid TLD', () => {
    expect(sanitizeEmail('employee@company.com').isValid).toBe(true);
    expect(sanitizeEmail('admin@example.mx').isValid).toBe(true);
  });

  it('returns error for invalid email format', () => {
    expect(sanitizeEmail('notanemail').isValid).toBe(false);
    expect(sanitizeEmail('@nodomain.com').isValid).toBe(false);
  });

  it('detects typosquatting domains', () => {
    const result = sanitizeEmail('user@gmail.co');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('gmail.com');
  });

  it('rejects disposable / temporary email services', () => {
    expect(sanitizeEmail('user@mailinator.com').isValid).toBe(false);
    expect(sanitizeEmail('user@guerrillamail.com').isValid).toBe(false);
  });

  it('returns error for invalid TLD', () => {
    const result = sanitizeEmail('user@example.xyz');
    expect(result.isValid).toBe(false);
  });
});

// ─── sanitizePassword ────────────────────────────────────────────────────────

describe('sanitizePassword', () => {
  it('returns error for null / empty password', () => {
    expect(sanitizePassword(null).isValid).toBe(false);
    expect(sanitizePassword('').isValid).toBe(false);
    expect(sanitizePassword(undefined).isValid).toBe(false);
  });

  it('returns error when password exceeds max length (128)', () => {
    const longPwd = 'A'.repeat(129);
    expect(sanitizePassword(longPwd).isValid).toBe(false);
  });

  it('accepts a valid password', () => {
    const result = sanitizePassword('MyP@ssw0rd');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('allows special characters without stripping them', () => {
    const result = sanitizePassword('!@#$%^&*()_+');
    expect(result.isValid).toBe(true);
  });
});

// ─── sanitizeName ────────────────────────────────────────────────────────────

describe('sanitizeName', () => {
  it('returns error for null / empty name', () => {
    expect(sanitizeName(null).isValid).toBe(false);
    expect(sanitizeName('').isValid).toBe(false);
  });

  it('returns error for name that is too short (< 2 chars after sanitization)', () => {
    expect(sanitizeName('A').isValid).toBe(false);
  });

  it('returns error for name that is too long', () => {
    const longName = 'A'.repeat(101);
    expect(sanitizeName(longName).isValid).toBe(false);
  });

  it('returns error for name with numbers or symbols', () => {
    expect(sanitizeName('John123').isValid).toBe(false);
    expect(sanitizeName('John@Doe').isValid).toBe(false);
  });

  it('accepts a standard name', () => {
    const result = sanitizeName('Juan Pérez');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Juan Pérez');
  });

  it('accepts names with accents and special Spanish chars', () => {
    expect(sanitizeName('María José').isValid).toBe(true);
    expect(sanitizeName('Martínez-López').isValid).toBe(true);
    expect(sanitizeName('Nuñez').isValid).toBe(true);
  });
});

// ─── validatePasswordStrength ────────────────────────────────────────────────

describe('validatePasswordStrength', () => {
  it('returns invalid for empty / null password', () => {
    expect(validatePasswordStrength('').isValid).toBe(false);
    expect(validatePasswordStrength(null).isValid).toBe(false);
  });

  it('returns error when password is shorter than 8 characters', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('8'))).toBe(true);
  });

  it('returns error when missing uppercase letter', () => {
    const result = validatePasswordStrength('abcde1!aaa');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('mayúscula'))).toBe(true);
  });

  it('returns error when missing lowercase letter', () => {
    const result = validatePasswordStrength('ABCDE1!AAA');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('minúscula'))).toBe(true);
  });

  it('returns error when missing number', () => {
    const result = validatePasswordStrength('Abcdefg!');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('número'))).toBe(true);
  });

  it('returns error when missing special character', () => {
    const result = validatePasswordStrength('Abcdefg1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('especial'))).toBe(true);
  });

  it('returns invalid for common passwords', () => {
    const result = validatePasswordStrength('password');
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe(0);
  });

  it('returns valid for a strong password', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBeGreaterThanOrEqual(4);
  });

  it('awards bonus strength for longer passwords (≥ 12 chars)', () => {
    // Use a password without special chars so base score is 4 (not capped at 5),
    // and the ≥12 length bonus brings it to 5.
    const short = validatePasswordStrength('Abcde123Fg');   // 10 chars, no special → 4
    const long  = validatePasswordStrength('Abcde123FgHi'); // 12 chars, no special → 5
    expect(long.strength).toBeGreaterThan(short.strength);
  });

  it('returns a strengthLabel string', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass');
    expect(typeof result.strengthLabel).toBe('string');
    expect(result.strengthLabel.length).toBeGreaterThan(0);
  });
});

// ─── validateLoginInput ───────────────────────────────────────────────────────

describe('validateLoginInput', () => {
  it('returns invalid when email is empty', () => {
    const result = validateLoginInput('', 'MyPass1!');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns invalid when password is missing', () => {
    const result = validateLoginInput('user@gmail.com', '');
    expect(result.isValid).toBe(false);
  });

  it('returns valid sanitizedEmail on success', () => {
    const result = validateLoginInput('User@Gmail.COM', 'AnyPass1!');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedEmail).toBe('user@gmail.com');
  });

  it('collects multiple errors', () => {
    const result = validateLoginInput('bad-email', '');
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── validateRegisterInput ───────────────────────────────────────────────────

describe('validateRegisterInput', () => {
  const validEmail = 'user@gmail.com';
  const validPassword = 'MyStr0ng!Pass';
  const validName = 'Juan Pérez';

  it('returns invalid for bad email', () => {
    const result = validateRegisterInput('bad', validPassword, validName);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for invalid name', () => {
    const result = validateRegisterInput(validEmail, validPassword, 'J0hn123');
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for weak password', () => {
    const result = validateRegisterInput(validEmail, 'weak', validName);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns valid for correct inputs', () => {
    const result = validateRegisterInput(validEmail, validPassword, validName);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedEmail).toBe(validEmail);
    expect(result.sanitizedName).toBe(validName);
    expect(result.passwordStrength).toBeGreaterThanOrEqual(4);
  });

  it('aggregates errors from all fields', () => {
    const result = validateRegisterInput('bad', 'weak', '1');
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── checkRateLimit & recordLoginAttempt ─────────────────────────────────────

describe('rate limiting', () => {
  const testId = 'ratelimit-test@gmail.com';

  beforeEach(() => {
    resetLoginAttempts(testId);
  });

  it('is not blocked initially', () => {
    const result = checkRateLimit(testId);
    expect(result.isBlocked).toBe(false);
    expect(result.remainingAttempts).toBe(5);
  });

  it('decrements remaining attempts after failed logins', () => {
    recordLoginAttempt(testId, false);
    recordLoginAttempt(testId, false);
    const result = checkRateLimit(testId);
    expect(result.isBlocked).toBe(false);
    expect(result.remainingAttempts).toBe(3);
  });

  it('blocks after 5 consecutive failures', () => {
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(testId, false);
    }
    const result = checkRateLimit(testId);
    expect(result.isBlocked).toBe(true);
    expect(result.remainingAttempts).toBe(0);
    expect(result.message).toMatch(/minuto/i);
  });

  it('clears attempts on successful login', () => {
    recordLoginAttempt(testId, false);
    recordLoginAttempt(testId, false);
    recordLoginAttempt(testId, true); // success → clear
    const result = checkRateLimit(testId);
    expect(result.isBlocked).toBe(false);
    expect(result.remainingAttempts).toBe(5);
  });

  it('is case-insensitive for the identifier', () => {
    recordLoginAttempt(testId.toUpperCase(), false);
    recordLoginAttempt(testId.toLowerCase(), false);
    const result = checkRateLimit(testId);
    expect(result.remainingAttempts).toBe(3);
  });
});

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('returns empty string for non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('');
  });

  it('escapes & character', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes < and > characters', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it('leaves safe characters unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

// ─── getSecurityConfig ───────────────────────────────────────────────────────

describe('getSecurityConfig', () => {
  it('returns minPasswordLength of 8', () => {
    expect(getSecurityConfig().minPasswordLength).toBe(8);
  });

  it('returns maxLoginAttempts of 5', () => {
    expect(getSecurityConfig().maxLoginAttempts).toBe(5);
  });

  it('returns lockoutDurationMinutes of 15', () => {
    expect(getSecurityConfig().lockoutDurationMinutes).toBe(15);
  });
});
