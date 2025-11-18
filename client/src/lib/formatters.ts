/**
 * Input formatting utilities for HR data fields
 * Ensures consistent formatting for third-party integrations (SCIM, Azure AD, etc.)
 */

/**
 * Format phone number as user types: (555) 555-5555
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply formatting
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Format SSN as user types: XXX-XX-XXXX
 */
export function formatSSN(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply formatting
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
}

/**
 * Format ZIP code as user types: 12345 or 12345-6789
 */
export function formatZipCode(value: string): string {
  // Remove all non-digits and hyphens
  const cleaned = value.replace(/[^\d-]/g, '');
  
  // Remove all hyphens to reformat
  const digits = cleaned.replace(/-/g, '');
  
  // Apply formatting
  if (digits.length === 0) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
}

/**
 * Unformat phone number for storage: extract digits only
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Unformat SSN for storage: extract digits only
 */
export function unformatSSN(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate phone number (US format)
 */
export function validatePhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Validate SSN
 */
export function validateSSN(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 9;
}

/**
 * Validate ZIP code (5 or 9 digits)
 */
export function validateZipCode(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 5 || digits.length === 9;
}

/**
 * Emergency contact relationship options
 * Standardized for SCIM/third-party integrations
 */
export const EMERGENCY_CONTACT_RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Partner',
  'Guardian',
  'Other'
] as const;

export type EmergencyContactRelationship = typeof EMERGENCY_CONTACT_RELATIONSHIPS[number];
