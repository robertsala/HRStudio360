import type { Express } from 'express';
import { db } from './db.js';
import { eq, and, lt } from 'drizzle-orm';
import { 
  mfaMethods, 
  mfaChallenges, 
  mfaAuditLog,
  organizationSettings,
  profiles
} from '../shared/schema.js';
import { 
  generateOTPCode, 
  generateSessionToken, 
  hashCode, 
  verifyCode, 
  maskPhoneNumber, 
  maskEmail, 
  isChallengeExpired, 
  calculateChallengeExpiry, 
  formatPhoneE164, 
  isValidPhoneNumber, 
  isValidEmail,
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCodeDataURL,
  verifyTOTPCode
} from './lib/mfa.js';
import { sendEmailOTP, sendSMSOTP } from './mfaService.js';
import rateLimit from 'express-rate-limit';

// Rate limiting for MFA endpoints to prevent code guessing attacks
const mfaRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: { error: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

export function registerMFARoutes(app: Express) {
  
  // Helper to check if user is authenticated
  function requireAuth(req: any): string | null {
    const userId = req.session?.userId;
    if (typeof userId !== 'string') {
      return null;
    }
    return userId;
  }

  // Helper to log MFA audit events
  async function logMFAAudit(
    profileId: string,
    action: string,
    methodType: string | null,
    success: boolean,
    req: any,
    errorMessage?: string
  ) {
    try {
      await db.insert(mfaAuditLog).values({
        profileId,
        action,
        methodType,
        success,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        errorMessage
      });
    } catch (error) {
      console.error('Failed to log MFA audit:', error);
    }
  }

  // Get organization MFA settings
  app.get('/api/mfa/settings', async (_req, res) => {
    try {
      const [orgSettings] = await db.select().from(organizationSettings).limit(1);
      
      if (!orgSettings) {
        // Return default settings if none exist (use frontend-compatible field names)
        return res.json({
          mfaEnabled: true,
          mfaEnforced: false,
          mfaRequired: false,
          mfaRequiredForRoles: ['HR', 'Product Owner'],
          allowedMethods: ['email', 'sms'],
          allowedMfaMethods: ['email', 'sms'],
          externalMfaProvider: null
        });
      }

      // Return both field name formats for compatibility
      res.json({
        ...orgSettings,
        mfaEnforced: orgSettings.mfaRequired,
        allowedMethods: orgSettings.allowedMfaMethods
      });
    } catch (error) {
      console.error('Failed to get MFA settings:', error);
      res.status(500).json({ error: 'Failed to get MFA settings' });
    }
  });

  // Get user's enrolled MFA methods
  app.get('/api/mfa/methods', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const methods = await db
        .select()
        .from(mfaMethods)
        .where(eq(mfaMethods.profileId, userId));

      // Mask sensitive information
      const maskedMethods = methods.map(method => ({
        id: method.id,
        methodType: method.methodType,
        methodValue: method.methodType === 'sms' 
          ? maskPhoneNumber(method.methodValue || '')
          : method.methodType === 'email'
          ? maskEmail(method.methodValue || '')
          : null,
        isPrimary: method.isPrimary,
        isVerified: method.isVerified,
        lastUsedAt: method.lastUsedAt,
        createdAt: method.createdAt
      }));

      res.json(maskedMethods);
    } catch (error) {
      console.error('Failed to get MFA methods:', error);
      res.status(500).json({ error: 'Failed to get MFA methods' });
    }
  });

  // Enroll a new MFA method (SMS or Email)
  app.post('/api/mfa/enroll', mfaRateLimiter, async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { methodType, methodValue } = req.body;

      // Validate method type
      if (!methodType || !['email', 'sms', 'totp', 'passkey'].includes(methodType)) {
        return res.status(400).json({ error: 'Invalid method type. Use "email", "sms", "totp", or "passkey".' });
      }

      // Validate method value based on type
      if (methodType === 'sms') {
        if (!methodValue || !isValidPhoneNumber(methodValue)) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
      } else if (methodType === 'email') {
        if (!methodValue || !isValidEmail(methodValue)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
      } else if (methodType === 'totp' || methodType === 'passkey') {
        // TOTP and Passkey don't require methodValue during enrollment
        // Secret/key will be generated
      }

      // Check if method already exists
      const existing = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.profileId, userId),
            eq(mfaMethods.methodType, methodType),
            eq(mfaMethods.methodValue, methodValue)
          )
        );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'This method is already enrolled' });
      }

      // Check if this is the first method (make it primary)
      const existingMethods = await db
        .select()
        .from(mfaMethods)
        .where(eq(mfaMethods.profileId, userId));

      const isPrimary = existingMethods.length === 0;

      // Handle TOTP enrollment differently
      if (methodType === 'totp') {
        // Get user's email for QR code label
        const [userProfile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, userId));

        if (!userProfile) {
          return res.status(404).json({ error: 'User profile not found' });
        }

        // Generate TOTP secret
        const { base32 } = generateTOTPSecret();
        const otpauthUri = generateTOTPUri(base32, userProfile.email);
        const qrCodeDataUrl = await generateQRCodeDataURL(otpauthUri);

        // Create the method with secret stored in methodValue
        const [newMethod] = await db
          .insert(mfaMethods)
          .values({
            profileId: userId,
            methodType: 'totp',
            methodValue: base32, // Store the secret
            isPrimary,
            isVerified: false
          })
          .returning();

        // Create a session token for verification (no code hash needed for TOTP)
        const sessionToken = generateSessionToken();

        await db.insert(mfaChallenges).values({
          profileId: userId,
          methodId: newMethod.id,
          methodType: 'totp',
          code: '', // No pre-generated code for TOTP
          sessionToken,
          status: 'pending',
          expiresAt: calculateChallengeExpiry()
        });

        await logMFAAudit(userId, 'enrollment_initiated', 'totp', true, req);

        return res.json({
          methodId: newMethod.id,
          sessionToken,
          requiresVerification: true,
          qrCode: qrCodeDataUrl,
          secret: base32, // Send the secret for manual entry
          message: 'Scan the QR code with your authenticator app'
        });
      }

      // Handle SMS/Email enrollment (original logic)
      const [newMethod] = await db
        .insert(mfaMethods)
        .values({
          profileId: userId,
          methodType,
          methodValue,
          isPrimary,
          isVerified: false
        })
        .returning();

      // Send verification code
      const code = generateOTPCode();
      const codeHash = await hashCode(code);
      const sessionToken = generateSessionToken();

      await db.insert(mfaChallenges).values({
        profileId: userId,
        methodId: newMethod.id,
        methodType,
        code: codeHash,
        sessionToken,
        status: 'pending',
        expiresAt: calculateChallengeExpiry()
      });

      // Send the code
      if (methodType === 'sms') {
        await sendSMSOTP(formatPhoneE164(methodValue), code);
      } else if (methodType === 'email') {
        await sendEmailOTP(methodValue, code);
      }

      await logMFAAudit(userId, 'enrollment_initiated', methodType, true, req);

      res.json({
        methodId: newMethod.id,
        sessionToken,
        requiresVerification: true,
        message: `Verification code sent to ${methodType === 'sms' ? maskPhoneNumber(methodValue) : maskEmail(methodValue)}`
      });
    } catch (error: any) {
      console.error('Failed to enroll MFA method:', error);
      const userId = requireAuth(req);
      if (userId) {
        await logMFAAudit(userId, 'enrollment_initiated', req.body.methodType, false, req, error.message);
      }
      res.status(500).json({ error: error.message || 'Failed to enroll MFA method' });
    }
  });

  // Alias: POST /api/mfa/methods (same as /api/mfa/enroll for frontend compatibility)
  app.post('/api/mfa/methods', mfaRateLimiter, async (req, res) => {
    // This is a direct alias - just handle the same way as enroll
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { methodType, methodValue } = req.body;

      // Validate method type
      if (!methodType || !['email', 'sms', 'totp', 'passkey'].includes(methodType)) {
        return res.status(400).json({ error: 'Invalid method type. Use "email", "sms", "totp", or "passkey".' });
      }

      // Validate method value based on type
      if (methodType === 'sms') {
        if (!methodValue || !isValidPhoneNumber(methodValue)) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
      } else if (methodType === 'email') {
        if (!methodValue || !isValidEmail(methodValue)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
      } else if (methodType === 'totp' || methodType === 'passkey') {
        // TOTP and Passkey don't require methodValue during enrollment
        // Secret/key will be generated
      }

      // Check if method already exists
      const existing = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.profileId, userId),
            eq(mfaMethods.methodType, methodType),
            eq(mfaMethods.methodValue, methodValue)
          )
        );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'This method is already enrolled' });
      }

      // Check if this is the first method (make it primary)
      const existingMethods = await db
        .select()
        .from(mfaMethods)
        .where(eq(mfaMethods.profileId, userId));

      const isPrimary = existingMethods.length === 0;

      // Handle TOTP enrollment differently
      if (methodType === 'totp') {
        // Get user's email for QR code label
        const [userProfile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, userId));

        if (!userProfile) {
          return res.status(404).json({ error: 'User profile not found' });
        }

        // Generate TOTP secret
        const { base32 } = generateTOTPSecret();
        const otpauthUri = generateTOTPUri(base32, userProfile.email);
        const qrCodeDataUrl = await generateQRCodeDataURL(otpauthUri);

        // Create the method with secret stored in methodValue
        const [newMethod] = await db
          .insert(mfaMethods)
          .values({
            profileId: userId,
            methodType: 'totp',
            methodValue: base32, // Store the secret
            isPrimary,
            isVerified: false
          })
          .returning();

        // Create a session token for verification (no code hash needed for TOTP)
        const sessionToken = generateSessionToken();

        await db.insert(mfaChallenges).values({
          profileId: userId,
          methodId: newMethod.id,
          methodType: 'totp',
          code: '', // No pre-generated code for TOTP
          sessionToken,
          status: 'pending',
          expiresAt: calculateChallengeExpiry()
        });

        await logMFAAudit(userId, 'enrollment_initiated', 'totp', true, req);

        return res.json({
          methodId: newMethod.id,
          sessionToken,
          requiresVerification: true,
          qrCode: qrCodeDataUrl,
          secret: base32, // Send the secret for manual entry
          message: 'Scan the QR code with your authenticator app'
        });
      }

      // Handle SMS/Email enrollment (original logic)
      const [newMethod] = await db
        .insert(mfaMethods)
        .values({
          profileId: userId,
          methodType,
          methodValue,
          isPrimary,
          isVerified: false
        })
        .returning();

      // Send verification code
      const code = generateOTPCode();
      const codeHash = await hashCode(code);
      const sessionToken = generateSessionToken();

      await db.insert(mfaChallenges).values({
        profileId: userId,
        methodId: newMethod.id,
        methodType,
        code: codeHash,
        sessionToken,
        status: 'pending',
        expiresAt: calculateChallengeExpiry()
      });

      // Send the code
      if (methodType === 'sms') {
        await sendSMSOTP(formatPhoneE164(methodValue), code);
      } else if (methodType === 'email') {
        await sendEmailOTP(methodValue, code);
      }

      await logMFAAudit(userId, 'enrollment_initiated', methodType, true, req);

      res.json({
        methodId: newMethod.id,
        sessionToken,
        requiresVerification: true,
        message: `Verification code sent to ${methodType === 'sms' ? maskPhoneNumber(methodValue) : maskEmail(methodValue)}`
      });
    } catch (error: any) {
      console.error('Failed to enroll MFA method:', error);
      const userId = requireAuth(req);
      if (userId) {
        await logMFAAudit(userId, 'enrollment_initiated', req.body.methodType, false, req, error.message);
      }
      res.status(500).json({ error: error.message || 'Failed to enroll MFA method' });
    }
  });

  // Verify enrollment with code
  app.post('/api/mfa/verify-enrollment', mfaRateLimiter, async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { sessionToken, code } = req.body;

      if (!sessionToken || !code) {
        return res.status(400).json({ error: 'Session token and code are required' });
      }

      // Find the challenge
      const [challenge] = await db
        .select()
        .from(mfaChallenges)
        .where(
          and(
            eq(mfaChallenges.sessionToken, sessionToken),
            eq(mfaChallenges.profileId, userId),
            eq(mfaChallenges.status, 'pending')
          )
        );

      if (!challenge) {
        return res.status(400).json({ error: 'Invalid or expired verification session' });
      }

      // Check if expired
      if (isChallengeExpired(challenge.expiresAt)) {
        await db
          .update(mfaChallenges)
          .set({ status: 'expired' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(userId, 'enrollment_verification', challenge.methodType, false, req, 'Code expired');
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Check if too many attempts
      if (challenge.attempts >= challenge.maxAttempts) {
        await db
          .update(mfaChallenges)
          .set({ status: 'failed' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(userId, 'enrollment_verification', challenge.methodType, false, req, 'Too many attempts');
        return res.status(400).json({ error: 'Too many verification attempts' });
      }

      // Verify the code - handle TOTP differently
      let isValid = false;
      
      if (challenge.methodType === 'totp') {
        // For TOTP, get the method to retrieve the secret
        const [method] = await db
          .select()
          .from(mfaMethods)
          .where(eq(mfaMethods.id, challenge.methodId));
        
        if (!method || !method.methodValue) {
          return res.status(400).json({ error: 'TOTP method not found or invalid' });
        }
        
        // Verify TOTP code against the secret
        isValid = verifyTOTPCode(method.methodValue, code);
      } else {
        // For SMS/Email, verify against the hashed code
        isValid = await verifyCode(challenge.code, code);
      }
      
      if (!isValid) {
        // Increment attempts
        await db
          .update(mfaChallenges)
          .set({ attempts: challenge.attempts + 1 })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(userId, 'enrollment_verification', challenge.methodType, false, req, 'Invalid code');
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark challenge as verified
      await db
        .update(mfaChallenges)
        .set({ 
          status: 'verified',
          verifiedAt: new Date()
        })
        .where(eq(mfaChallenges.id, challenge.id));

      // Mark the specific MFA method as verified (use methodId to ensure only this specific method is verified)
      if (challenge.methodId) {
        await db
          .update(mfaMethods)
          .set({ isVerified: true })
          .where(eq(mfaMethods.id, challenge.methodId));
      } else {
        // Fallback for legacy challenges without methodId - mark by type (less precise)
        await db
          .update(mfaMethods)
          .set({ isVerified: true })
          .where(
            and(
              eq(mfaMethods.profileId, userId),
              eq(mfaMethods.methodType, challenge.methodType)
            )
          );
      }

      await logMFAAudit(userId, 'enrollment_verified', challenge.methodType, true, req);

      res.json({ success: true, message: 'MFA method verified successfully' });
    } catch (error: any) {
      console.error('Failed to verify enrollment:', error);
      const userId = requireAuth(req);
      if (userId) {
        await logMFAAudit(userId, 'enrollment_verification', null, false, req, error.message);
      }
      res.status(500).json({ error: 'Failed to verify enrollment' });
    }
  });

  // Initiate MFA challenge during login (called by login route)
  app.post('/api/mfa/initiate', mfaRateLimiter, async (req, res) => {
    try {
      const { profileId, methodType } = req.body;

      if (!profileId) {
        return res.status(400).json({ error: 'Profile ID is required' });
      }

      // Get user's MFA methods
      const methods = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.profileId, profileId),
            eq(mfaMethods.isVerified, true)
          )
        );

      if (methods.length === 0) {
        return res.status(400).json({ error: 'No MFA methods enrolled' });
      }

      // If methodType specified, use it. Otherwise use primary method
      let selectedMethod = methodType
        ? methods.find(m => m.methodType === methodType)
        : methods.find(m => m.isPrimary) || methods[0];

      if (!selectedMethod) {
        return res.status(400).json({ error: 'Invalid MFA method' });
      }

      // Generate code
      const code = generateOTPCode();
      const codeHash = await hashCode(code);
      const sessionToken = generateSessionToken();

      // Create challenge
      await db.insert(mfaChallenges).values({
        profileId,
        methodId: selectedMethod.id,
        methodType: selectedMethod.methodType,
        code: codeHash,
        sessionToken,
        status: 'pending',
        expiresAt: calculateChallengeExpiry()
      });

      // Send the code
      if (selectedMethod.methodType === 'sms' && selectedMethod.methodValue) {
        await sendSMSOTP(formatPhoneE164(selectedMethod.methodValue), code);
      } else if (selectedMethod.methodType === 'email' && selectedMethod.methodValue) {
        await sendEmailOTP(selectedMethod.methodValue, code);
      }

      // Return masked methods for UI display
      const maskedMethods = methods.map(m => ({
        methodType: m.methodType,
        methodValue: m.methodType === 'sms' 
          ? maskPhoneNumber(m.methodValue || '')
          : maskEmail(m.methodValue || '')
      }));

      await logMFAAudit(profileId, 'login_challenge_initiated', selectedMethod.methodType, true, req);

      res.json({
        sessionToken,
        methods: maskedMethods,
        selectedMethod: {
          methodType: selectedMethod.methodType,
          methodValue: selectedMethod.methodType === 'sms'
            ? maskPhoneNumber(selectedMethod.methodValue || '')
            : maskEmail(selectedMethod.methodValue || '')
        }
      });
    } catch (error: any) {
      console.error('Failed to initiate MFA:', error);
      res.status(500).json({ error: error.message || 'Failed to initiate MFA' });
    }
  });

  // Verify MFA code during login
  app.post('/api/mfa/verify', mfaRateLimiter, async (req, res) => {
    try {
      const { sessionToken, code } = req.body;

      if (!sessionToken || !code) {
        return res.status(400).json({ error: 'Session token and code are required' });
      }

      // Find the challenge
      const [challenge] = await db
        .select()
        .from(mfaChallenges)
        .where(
          and(
            eq(mfaChallenges.sessionToken, sessionToken),
            eq(mfaChallenges.status, 'pending')
          )
        );

      if (!challenge) {
        return res.status(400).json({ error: 'Invalid or expired verification session' });
      }

      // Check if expired
      if (isChallengeExpired(challenge.expiresAt)) {
        await db
          .update(mfaChallenges)
          .set({ status: 'expired' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Code expired');
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Check if too many attempts
      if (challenge.attempts >= challenge.maxAttempts) {
        await db
          .update(mfaChallenges)
          .set({ status: 'failed' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Too many attempts');
        return res.status(400).json({ error: 'Too many verification attempts' });
      }

      // Verify the code
      const isValid = await verifyCode(challenge.code, code);
      
      if (!isValid) {
        // Increment attempts
        await db
          .update(mfaChallenges)
          .set({ attempts: challenge.attempts + 1 })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Invalid code');
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark challenge as verified
      await db
        .update(mfaChallenges)
        .set({ 
          status: 'verified',
          verifiedAt: new Date()
        })
        .where(eq(mfaChallenges.id, challenge.id));

      // Update last used timestamp on the specific method
      if (challenge.methodId) {
        await db
          .update(mfaMethods)
          .set({ lastUsedAt: new Date() })
          .where(eq(mfaMethods.id, challenge.methodId));
      } else {
        // Fallback for legacy challenges without methodId
        await db
          .update(mfaMethods)
          .set({ lastUsedAt: new Date() })
          .where(
            and(
              eq(mfaMethods.profileId, challenge.profileId),
              eq(mfaMethods.methodType, challenge.methodType)
            )
          );
      }

      // Create actual session
      (req.session as any).userId = challenge.profileId;

      await logMFAAudit(challenge.profileId, 'login_verified', challenge.methodType, true, req);

      res.json({ success: true, profileId: challenge.profileId });
    } catch (error: any) {
      console.error('Failed to verify MFA:', error);
      res.status(500).json({ error: 'Failed to verify MFA code' });
    }
  });

  // Alias: POST /api/mfa/verify-login (same as /api/mfa/verify for frontend compatibility)
  app.post('/api/mfa/verify-login', mfaRateLimiter, async (req, res) => {
    // This is a direct alias - delegate to the main verify handler
    try {
      const { sessionToken, code } = req.body;

      if (!sessionToken || !code) {
        return res.status(400).json({ error: 'Session token and code are required' });
      }

      // Find the challenge
      const [challenge] = await db
        .select()
        .from(mfaChallenges)
        .where(
          and(
            eq(mfaChallenges.sessionToken, sessionToken),
            eq(mfaChallenges.status, 'pending')
          )
        );

      if (!challenge) {
        return res.status(400).json({ error: 'Invalid or expired verification session' });
      }

      // Check if expired
      if (isChallengeExpired(challenge.expiresAt)) {
        await db
          .update(mfaChallenges)
          .set({ status: 'expired' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Code expired');
        return res.status(400).json({ error: 'Verification code has expired' });
      }

      // Check if too many attempts
      if (challenge.attempts >= challenge.maxAttempts) {
        await db
          .update(mfaChallenges)
          .set({ status: 'failed' })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Too many attempts');
        return res.status(400).json({ error: 'Too many verification attempts' });
      }

      // Verify the code
      const isValid = await verifyCode(challenge.code, code);
      
      if (!isValid) {
        // Increment attempts
        await db
          .update(mfaChallenges)
          .set({ attempts: challenge.attempts + 1 })
          .where(eq(mfaChallenges.id, challenge.id));
        
        await logMFAAudit(challenge.profileId, 'login_verification', challenge.methodType, false, req, 'Invalid code');
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark challenge as verified
      await db
        .update(mfaChallenges)
        .set({ 
          status: 'verified',
          verifiedAt: new Date()
        })
        .where(eq(mfaChallenges.id, challenge.id));

      // Update last used timestamp on the specific method
      if (challenge.methodId) {
        await db
          .update(mfaMethods)
          .set({ lastUsedAt: new Date() })
          .where(eq(mfaMethods.id, challenge.methodId));
      } else {
        // Fallback for legacy challenges without methodId
        await db
          .update(mfaMethods)
          .set({ lastUsedAt: new Date() })
          .where(
            and(
              eq(mfaMethods.profileId, challenge.profileId),
              eq(mfaMethods.methodType, challenge.methodType)
            )
          );
      }

      // Create actual session
      (req.session as any).userId = challenge.profileId;

      await logMFAAudit(challenge.profileId, 'login_verified', challenge.methodType, true, req);

      res.json({ success: true, profileId: challenge.profileId });
    } catch (error: any) {
      console.error('Failed to verify MFA:', error);
      res.status(500).json({ error: 'Failed to verify MFA code' });
    }
  });

  // Resend verification code
  app.post('/api/mfa/resend', mfaRateLimiter, async (req, res) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: 'Session token is required' });
      }

      // Find the existing challenge
      const [challenge] = await db
        .select()
        .from(mfaChallenges)
        .where(eq(mfaChallenges.sessionToken, sessionToken));

      if (!challenge) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      // Get the method to send to (prefer methodId if available)
      let method;
      if (challenge.methodId) {
        [method] = await db
          .select()
          .from(mfaMethods)
          .where(eq(mfaMethods.id, challenge.methodId));
      } else {
        // Fallback for legacy challenges without methodId
        [method] = await db
          .select()
          .from(mfaMethods)
          .where(
            and(
              eq(mfaMethods.profileId, challenge.profileId),
              eq(mfaMethods.methodType, challenge.methodType)
            )
          );
      }

      if (!method || !method.methodValue) {
        return res.status(400).json({ error: 'MFA method not found' });
      }

      // Generate new code
      const code = generateOTPCode();
      const codeHash = await hashCode(code);

      // Update the challenge with new code and reset attempts
      await db
        .update(mfaChallenges)
        .set({
          code: codeHash,
          status: 'pending',
          attempts: 0,
          expiresAt: calculateChallengeExpiry()
        })
        .where(eq(mfaChallenges.id, challenge.id));

      // Send the new code
      if (method.methodType === 'sms') {
        await sendSMSOTP(formatPhoneE164(method.methodValue), code);
      } else if (method.methodType === 'email') {
        await sendEmailOTP(method.methodValue, code);
      }

      await logMFAAudit(challenge.profileId, 'code_resent', challenge.methodType, true, req);

      res.json({ success: true, message: 'Verification code resent' });
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      res.status(500).json({ error: error.message || 'Failed to resend code' });
    }
  });

  // Alias: POST /api/mfa/resend-code (same as /api/mfa/resend for frontend compatibility)
  app.post('/api/mfa/resend-code', mfaRateLimiter, async (req, res) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: 'Session token is required' });
      }

      // Find the existing challenge
      const [challenge] = await db
        .select()
        .from(mfaChallenges)
        .where(eq(mfaChallenges.sessionToken, sessionToken));

      if (!challenge) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      // Get the method to send to (prefer methodId if available)
      let method;
      if (challenge.methodId) {
        [method] = await db
          .select()
          .from(mfaMethods)
          .where(eq(mfaMethods.id, challenge.methodId));
      } else {
        // Fallback for legacy challenges without methodId
        [method] = await db
          .select()
          .from(mfaMethods)
          .where(
            and(
              eq(mfaMethods.profileId, challenge.profileId),
              eq(mfaMethods.methodType, challenge.methodType)
            )
          );
      }

      if (!method || !method.methodValue) {
        return res.status(400).json({ error: 'MFA method not found' });
      }

      // Generate new code
      const code = generateOTPCode();
      const codeHash = await hashCode(code);

      // Update the challenge with new code and reset attempts
      await db
        .update(mfaChallenges)
        .set({
          code: codeHash,
          status: 'pending',
          attempts: 0,
          expiresAt: calculateChallengeExpiry()
        })
        .where(eq(mfaChallenges.id, challenge.id));

      // Send the new code
      if (method.methodType === 'sms') {
        await sendSMSOTP(formatPhoneE164(method.methodValue), code);
      } else if (method.methodType === 'email') {
        await sendEmailOTP(method.methodValue, code);
      }

      await logMFAAudit(challenge.profileId, 'code_resent', challenge.methodType, true, req);

      res.json({ success: true, message: 'Verification code resent' });
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      res.status(500).json({ error: error.message || 'Failed to resend code' });
    }
  });

  // Delete an MFA method
  app.delete('/api/mfa/methods/:methodId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { methodId } = req.params;

      // Check if method exists and belongs to user
      const [method] = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.id, methodId),
            eq(mfaMethods.profileId, userId)
          )
        );

      if (!method) {
        return res.status(404).json({ error: 'MFA method not found' });
      }

      // Check if this is the only method
      const allMethods = await db
        .select()
        .from(mfaMethods)
        .where(eq(mfaMethods.profileId, userId));

      if (allMethods.length === 1) {
        return res.status(400).json({ error: 'Cannot remove the only MFA method. Add another method first.' });
      }

      // Delete the method
      await db
        .delete(mfaMethods)
        .where(eq(mfaMethods.id, methodId));

      // If this was the primary method, make another method primary
      if (method.isPrimary) {
        const [nextMethod] = await db
          .select()
          .from(mfaMethods)
          .where(eq(mfaMethods.profileId, userId))
          .limit(1);

        if (nextMethod) {
          await db
            .update(mfaMethods)
            .set({ isPrimary: true })
            .where(eq(mfaMethods.id, nextMethod.id));
        }
      }

      await logMFAAudit(userId, 'method_removed', method.methodType, true, req);

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete MFA method:', error);
      res.status(500).json({ error: 'Failed to delete MFA method' });
    }
  });

  // Set primary MFA method
  app.post('/api/mfa/methods/:methodId/set-primary', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { methodId } = req.params;

      // Verify method belongs to user
      const [method] = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.id, methodId),
            eq(mfaMethods.profileId, userId)
          )
        );

      if (!method) {
        return res.status(404).json({ error: 'MFA method not found' });
      }

      if (!method.isVerified) {
        return res.status(400).json({ error: 'Cannot set unverified method as primary' });
      }

      // Remove primary from all other methods
      await db
        .update(mfaMethods)
        .set({ isPrimary: false })
        .where(eq(mfaMethods.profileId, userId));

      // Set this method as primary
      await db
        .update(mfaMethods)
        .set({ isPrimary: true })
        .where(eq(mfaMethods.id, methodId));

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to set primary method:', error);
      res.status(500).json({ error: 'Failed to set primary method' });
    }
  });

  // Clean up expired challenges (can be called periodically)
  app.post('/api/mfa/cleanup', async (_req, res) => {
    try {
      const now = new Date();
      
      await db
        .update(mfaChallenges)
        .set({ status: 'expired' })
        .where(
          and(
            eq(mfaChallenges.status, 'pending'),
            lt(mfaChallenges.expiresAt, now)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to cleanup challenges:', error);
      res.status(500).json({ error: 'Failed to cleanup challenges' });
    }
  });
}
