// Argon2 with graceful fallback for production environments
// where native modules may fail to load

let argon2: typeof import('argon2') | null = null;
let argon2LoadError: string | null = null;

// Attempt to load argon2 - if it fails, we'll use a fallback
try {
  argon2 = await import('argon2');
  console.log('[Password] ✅ argon2 native module loaded successfully');
} catch (err: any) {
  argon2LoadError = err?.message || 'Unknown error loading argon2';
  console.error('[Password] ⚠️ Failed to load argon2 native module:', argon2LoadError);
  console.error('[Password] Stack trace:', err?.stack);
  console.error('[Password] The server will continue but password operations will fail gracefully');
}

/**
 * Argon2id password hashing configuration for security audits
 * Settings based on OWASP recommendations
 */
const ARGON2_OPTIONS = argon2 ? {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 65536 KiB (~65 MB)
  timeCost: 3,         // Number of iterations
  parallelism: 1       // Number of threads
} : null;

/**
 * Common weak passwords to deny
 * In production, use HaveIBeenPwned API or larger denylist
 */
const COMMON_PASSWORDS = new Set([
  'password', 'Password123', '12345678', 'qwerty', 'abc123',
  'password1', '123456789', 'password123', 'demo', 'admin',
  'welcome', 'letmein', 'monkey', '1234567890', 'dragon'
]);

/**
 * Password validation requirements for security audits
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minCharacterClasses: number; // Require at least N of the 4 classes
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minCharacterClasses: 3 // Require 3 of 4 character classes
};

/**
 * Validate password against security requirements
 */
export function validatePassword(
  password: string,
  email?: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length check
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Character class checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  const characterClassCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;

  if (characterClassCount < requirements.minCharacterClasses) {
    errors.push(
      `Password must contain at least ${requirements.minCharacterClasses} of the following: ` +
      `uppercase letters, lowercase letters, numbers, special characters`
    );
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password) || COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  // Check if password contains email (prevent user@example.com using "user" as password)
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailUsername) && emailUsername.length > 3) {
      errors.push('Password should not contain your email address');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Hash a password using Argon2id
 * Throws an error if argon2 is not available
 */
export async function hashPassword(password: string): Promise<string> {
  if (!argon2 || !ARGON2_OPTIONS) {
    console.error('[Password] Cannot hash password: argon2 module not available');
    console.error('[Password] Original load error:', argon2LoadError);
    throw new Error('Password hashing service unavailable. The argon2 native module failed to load. Please contact system administrator.');
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its hash
 * Returns false if argon2 is not available (fails safely)
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!argon2) {
    console.error('[Password] Cannot verify password: argon2 module not available');
    console.error('[Password] Original load error:', argon2LoadError);
    // For security, return false if we can't verify (deny access)
    return false;
  }
  
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Invalid hash format or other error
    console.error('[Password] Verification error:', error);
    return false;
  }
}

/**
 * Check if argon2 is available for password operations
 */
export function isArgon2Available(): boolean {
  return argon2 !== null;
}

/**
 * Get the argon2 load error if it failed
 */
export function getArgon2LoadError(): string | null {
  return argon2LoadError;
}

/**
 * Check if account is locked due to failed login attempts
 */
export function isAccountLocked(lockedUntil: Date | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
}

/**
 * Calculate lockout duration based on failed attempts
 * Progressive lockout: more failures = longer lockout
 */
export function calculateLockoutDuration(failedAttempts: number): number {
  // 5 failures: 15 minutes
  // 10 failures: 30 minutes
  // 15+ failures: 1 hour
  if (failedAttempts >= 15) return 60 * 60 * 1000; // 1 hour
  if (failedAttempts >= 10) return 30 * 60 * 1000; // 30 minutes
  if (failedAttempts >= 5) return 15 * 60 * 1000;  // 15 minutes
  return 0; // No lockout yet
}
