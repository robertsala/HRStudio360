import crypto from 'crypto';
import argon2 from 'argon2';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate a 6-digit OTP code (for SMS/Email)
 */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a TOTP secret for authenticator apps
 * Returns the secret in base32 format
 */
export function generateTOTPSecret(): { secret: string; base32: string } {
  const secret = speakeasy.generateSecret({
    name: 'HRStudio360',
    length: 32
  });
  
  return {
    secret: secret.ascii,
    base32: secret.base32
  };
}

/**
 * Generate otpauth:// URI for QR code generation
 */
export function generateTOTPUri(secret: string, userEmail: string): string {
  return speakeasy.otpauthURL({
    secret: secret,
    label: userEmail,
    issuer: 'HRStudio360',
    encoding: 'base32'
  });
}

/**
 * Generate a QR code data URL from otpauth:// URI
 */
export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps before/after for clock skew
  });
}

/**
 * Generate a secure random session token for MFA challenges
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate backup codes for account recovery
 * Returns 10 random 8-character alphanumeric codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters (I, O, 1, 0)
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += charset[crypto.randomInt(charset.length)];
    }
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Hash a code or backup code using Argon2id for secure storage
 */
export async function hashCode(code: string): Promise<string> {
  return argon2.hash(code, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });
}

/**
 * Verify a code against its hash
 */
export async function verifyCode(hash: string, code: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, code);
  } catch (error) {
    return false;
  }
}

/**
 * Mask phone number for display (e.g., "•••) ••• 4073")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) {
    return '••••';
  }
  const last4 = phone.slice(-4);
  return `(•••) ••• ${last4}`;
}

/**
 * Mask email for display (e.g., "jo••••••••••••@gmail.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '••••••••••••';
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}•@${domain}`;
  }
  
  const visibleChars = 2;
  const maskedLength = Math.max(localPart.length - visibleChars, 1);
  const masked = '•'.repeat(maskedLength);
  
  return `${localPart.slice(0, visibleChars)}${masked}@${domain}`;
}

/**
 * Check if MFA challenge has expired (10 minute expiry)
 */
export function isChallengeExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate challenge expiry time (10 minutes from now)
 */
export function calculateChallengeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

/**
 * Format phone number to E.164 format for SMS sending
 * Assumes US phone numbers for simplicity
 */
export function formatPhoneE164(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code (11 digits), return with +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If 10 digits, add US country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Return as-is if can't determine format
  return phone;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Accept 10-digit US numbers or 11-digit with country code
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
