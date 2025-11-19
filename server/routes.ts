import type { Express } from 'express';
import { storage } from './storage.js';
import { 
  insertProfileSchema, insertEmployeeSchema, insertLeaveRequestSchema, insertLeaveBalanceSchema,
  insertCandidateSchema, insertExpenseCategorySchema, insertExpenseSchema, 
  insertChatChannelSchema, insertChannelMemberSchema, insertChatMessageSchema,
  insertMessageReactionSchema, insertTypingIndicatorSchema, insertUserPresenceSchema,
  insertUserNotificationSchema, insertCollaboratorInvitationSchema,
  insertChangeLogSchema, insertHistoricalChangeSchema, insertChangeNotificationSchema,
  insertEarnedBadgeSchema, insertCelebrationHistorySchema, insertCelebrationNotificationSchema,
  insertReviewCycleSchema,
  insertTaxJurisdictionSchema, insertReciprocalAgreementSchema,
  insertEmployeeTaxConfigurationSchema, insertAutoFixAuditLogSchema,
  insertPermissionTemplateSchema, insertRoleHierarchySchema,
  insertTimeBasedPermissionGrantSchema, insertPermissionRequestSchema,
  insertCallSessionSchema, insertCallParticipantSchema, insertCallSignalingSchema,
  profiles,
  authCredentials,
  passwordResetTokens,
  passwordAuditLog,
  paycheckFunFacts,
  tutorials,
  tutorialSteps,
  tutorialCompletions,
  tutorialCertificates,
  tutorialBadges,
  userTutorialBadges,
  callSessions,
  callParticipants
} from '../shared/schema.js';
import { sendCollaboratorInviteEmail, sendCollaboratorAcceptedEmail } from './emailService.js';
import { sendAutoFixNotificationEmail, notificationService } from './notification-service.js';
import { seedProductionDatabase } from './seed-production.js';
import { hashPassword, verifyPassword, validatePassword, isAccountLocked } from './lib/password.js';
import rateLimit from 'express-rate-limit';
import { db } from './db.js';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';
import { ObjectPermission } from './objectAcl.js';
import {
  screenCandidate,
  batchScreenCandidates,
  generateHiringInsights,
  runDailyScreeningWorkflow,
  validatePayrollRun,
  analyzeExpenses,
  chatWithPayrollAI
} from './ai-agent.js';
import { chatWithStudioAI } from './ai-assistant.js';
import { taxCalculator } from './tax-calculator.js';
import { TaxDataService } from './tax-data-service.js';
import { suggestTaxConfiguration, batchSuggestTaxConfigurations } from './ai-agent.js';
import OpenAI from 'openai';

// Initialize OpenAI client for address validation
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerRoutes(app: Express) {
  // Rate limiting for authentication endpoints to prevent brute-force attacks
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for demo account to ensure accessibility
    skip: (req) => req.body?.email === 'demo@hrstudio360.com'
  });

  // Helper function to check if user can manage announcements
  async function canManageAnnouncements(userId: string): Promise<boolean> {
    try {
      const profile = await storage.getProfileById(userId);
      if (!profile) return false;
      
      return profile.department === 'HR' || profile.role === 'Product Owner';
    } catch (error) {
      return false;
    }
  }

  // Auth helper - validates session and returns userId as string
  function requireAuth(req: any): string | null {
    const userId = req.session?.userId;
    if (typeof userId !== 'string') {
      return null;
    }
    return userId;
  }

  // Object Storage Routes - For profile pictures and file uploads
  // Based on javascript_object_storage blueprint

  // Track issued upload tokens with server-generated object keys for security
  // Maps uploadToken -> { userId, objectKey, uploadURL, expiresAt }
  const issuedUploadTokens = new Map<string, { 
    userId: string; 
    objectKey: string; // Server-generated canonical key
    uploadURL: string;
    expiresAt: number;
  }>();

  // Cleanup expired upload tokens every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of issuedUploadTokens.entries()) {
      if (data.expiresAt < now) {
        issuedUploadTokens.delete(token);
      }
    }
  }, 5 * 60 * 1000);

  // Upload profile picture as base64 (authenticated)
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Server-side validation for file uploads
      const { fileName, fileSize, fileType, base64Data } = req.body;
      
      // Validate required fields
      if (!fileName || !fileSize || !fileType || !base64Data) {
        return res.status(400).json({ error: 'fileName, fileSize, fileType, and base64Data are required' });
      }

      // Validate file size (max 5MB for profile pictures)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }

      // Validate file type (images only)
      if (!fileType.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }

      // Validate base64 format
      if (!base64Data.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid base64 image data' });
      }

      // Save profile picture to database
      try {
        await storage.updateProfile(userId, { profilePicture: base64Data });
        console.log(`Profile picture saved for user ${userId}`);
      } catch (dbError: any) {
        console.error('Error saving profile picture to database:', dbError);
        return res.status(500).json({ error: 'Failed to save profile picture to database' });
      }

      // Return the base64 data URL
      res.json({ imageUrl: base64Data });
    } catch (error: any) {
      console.error('Error processing upload:', error);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  });

  // Normalize and set ACL for uploaded object using secure token (authenticated)
  app.post('/api/objects/normalize', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { uploadToken } = req.body;
      if (!uploadToken) {
        return res.status(400).json({ error: 'uploadToken is required' });
      }

      // SECURITY: Validate the upload token
      const tokenData = issuedUploadTokens.get(uploadToken);
      if (!tokenData) {
        return res.status(403).json({ error: 'Invalid or expired upload token' });
      }

      // Verify the token belongs to the current user
      if (tokenData.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized: Token was not issued to you' });
      }

      // Check token hasn't expired
      if (tokenData.expiresAt < Date.now()) {
        issuedUploadTokens.delete(uploadToken);
        return res.status(403).json({ error: 'Upload token has expired' });
      }

      // Remove the token immediately after validation (one-time use)
      issuedUploadTokens.delete(uploadToken);

      const objectStorageService = new ObjectStorageService();
      
      // SECURITY: Verify object exists before setting ACL
      // This prevents setting ACL on non-existent or unauthorized objects
      try {
        await objectStorageService.getObjectEntityFile(tokenData.objectKey);
      } catch (error) {
        console.error('Object does not exist:', tokenData.objectKey);
        return res.status(404).json({ error: 'Uploaded object not found' });
      }
      
      // Use ONLY the server-tracked canonical objectKey (never trust client input)
      // This prevents ACL tampering attacks via URL manipulation
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        tokenData.objectKey,
        {
          owner: userId,
          visibility: 'public', // Profile pictures are public
        }
      );

      res.json({ objectPath: normalizedPath });
    } catch (error: any) {
      console.error('Error normalizing object:', error);
      res.status(500).json({ error: 'Failed to normalize object' });
    }
  });

  // Serve uploaded objects with ACL enforcement
  app.use('/objects', async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      // req.originalUrl will include the full path like /objects/uploads/123
      const objectFile = await objectStorageService.getObjectEntityFile(req.originalUrl);
      
      // Enforce ACL checks for security
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        // Return 404 instead of 403 to avoid leaking information about object existence
        return res.sendStatus(404);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Error serving object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // NOTE: Profile picture update endpoint removed to prevent ACL bypass vulnerability
  // When implementing candidate edit functionality, use the same secure token flow
  // as the upload/normalize endpoints above

  // Profile routes
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const profile = await storage.getProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/profiles', async (req, res) => {
    try {
      // Require authentication
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user has permission to create profiles with elevated roles
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      
      // Extract role and department from request
      const { role, department, ...basicFields } = req.body;
      const requestingElevatedRole = role === 'Product Owner' || role === 'Admin';
      const requestingHRDepartment = department === 'HR';

      // Only privileged users can create profiles with elevated roles or HR department
      if ((requestingElevatedRole || requestingHRDepartment) && !hasPrivilegedRole) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create profiles with elevated roles' 
        });
      }

      // Build the profile data with safe defaults for non-privileged users
      const profileData = hasPrivilegedRole 
        ? req.body 
        : { ...basicFields, role: role || 'Employee', department: department || 'General' };

      const validated = insertProfileSchema.parse(profileData);
      const profile = await storage.createProfile(validated);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/profiles/:id', async (req, res) => {
    try {
      // Require authentication
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const targetProfileId = req.params.id;
      const isOwnProfile = userId === targetProfileId;
      
      // Check if user has permission to manage profiles
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      
      // Restrict who can edit which profiles
      if (!isOwnProfile && !hasPrivilegedRole) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
      }

      // Extract sensitive fields from the update payload
      const { role, department, ...basicFields } = req.body;
      const hasSensitiveFields = role !== undefined || department !== undefined;

      // Only privileged users can change role/department
      if (hasSensitiveFields && !hasPrivilegedRole) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can change role or department' 
        });
      }

      // Build the final update payload
      let updateData = hasSensitiveFields && hasPrivilegedRole
        ? req.body  // Include all fields for privileged users
        : basicFields;  // Only basic fields for regular users

      // Normalize phone numbers - strip formatting for database storage (SCIM compatibility)
      const normalizePhone = (phone: string | null | undefined): string | null => {
        if (!phone) return null;
        return phone.replace(/\D/g, '') || null;
      };

      if (updateData.phone) {
        updateData.phone = normalizePhone(updateData.phone);
        // Validate normalized phone number is exactly 10 digits
        if (updateData.phone && updateData.phone.length !== 10) {
          return res.status(400).json({ 
            error: 'Invalid phone number: must be exactly 10 digits' 
          });
        }
      }
      if (updateData.emergencyContactPhone) {
        updateData.emergencyContactPhone = normalizePhone(updateData.emergencyContactPhone);
        // Validate normalized emergency contact phone is exactly 10 digits
        if (updateData.emergencyContactPhone && updateData.emergencyContactPhone.length !== 10) {
          return res.status(400).json({ 
            error: 'Invalid emergency contact phone: must be exactly 10 digits' 
          });
        }
      }

      // Filter out invalid fields that don't exist in the schema
      const validFields = [
        'email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 
        'zipCode', 'profilePicture', 'department', 'role', 'dateOfBirth', 'hireDate',
        'languagePreference', 'themePreference', 'locationLat', 'locationLon',
        'locationCity', 'locationState', 'locationZipCode', 'locationManualOverride',
        'workLocationState', 'workLocationCity', 'residenceState', 'residenceCity',
        'canAccessOrgChart', 'managerId', 'emergencyContactFirstName', 
        'emergencyContactLastName', 'emergencyContactMiddleName', 
        'emergencyContactRelationship', 'emergencyContactPhone'
      ];
      
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => validFields.includes(key))
      );

      // If there's nothing left to update after filtering, return success with current profile
      if (Object.keys(filteredUpdateData).length === 0) {
        const currentProfile = await storage.getProfile(targetProfileId);
        if (!currentProfile) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        return res.json(currentProfile);
      }

      const profile = await storage.updateProfile(targetProfileId, filteredUpdateData);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      console.error('❌ PROFILE UPDATE ERROR:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        updateData: req.body
      });
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // AI Address Validation endpoint
  app.post('/api/ai/validate-address', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { city, state, zipCode } = req.body;
      
      if (!city || !state || !zipCode) {
        return res.status(400).json({ error: 'City, state, and zipCode are required' });
      }

      // Use OpenAI to validate the address
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an address validation expert. Your job is to verify if a given ZIP code matches the specified city and state in the United States.
            
            Respond ONLY with a JSON object in this exact format:
            {
              "valid": true/false,
              "message": "explanation message",
              "suggestion": "corrected city/state if applicable, or null"
            }
            
            Rules:
            - If the ZIP code correctly matches the city and state, return valid: true
            - If the ZIP code is in the correct state but different city, return valid: false with a suggestion
            - If the ZIP code is in a different state entirely, return valid: false
            - Be aware that some ZIP codes can span multiple cities
            - Consider common abbreviations and alternative city names`
          },
          {
            role: 'user',
            content: `Validate this address:\nCity: ${city}\nState: ${state}\nZIP Code: ${zipCode}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        return res.status(500).json({ error: 'AI validation failed' });
      }

      // Parse AI response
      let validation;
      try {
        validation = JSON.parse(aiResponse);
      } catch (parseError) {
        // If AI doesn't return valid JSON, assume validation passed to not block user
        validation = { 
          valid: true, 
          message: 'Address validation could not be completed, proceeding anyway.',
          suggestion: null 
        };
      }

      res.json(validation);
    } catch (error: any) {
      console.error('AI address validation error:', error);
      // On error, don't block the user - return success with a note
      res.json({ 
        valid: true, 
        message: 'Address validation service temporarily unavailable. Address accepted.',
        suggestion: null 
      });
    }
  });

  // Address Change Request routes
  app.post('/api/address-change-requests', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { profileId, oldAddress, oldCity, oldState, oldZipCode, newAddress, newCity, newState, newZipCode } = req.body;

      if (!profileId || !newAddress || !newCity || !newState || !newZipCode) {
        return res.status(400).json({ error: 'Profile ID and new address fields are required' });
      }

      const request = await storage.createAddressChangeRequest({
        profileId,
        requestedBy: userId,
        oldAddress,
        oldCity,
        oldState,
        oldZipCode,
        newAddress,
        newCity,
        newState,
        newZipCode,
        status: 'Pending'
      });

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/address-change-requests', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user has HR/admin privileges
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      if (!hasPrivilegedRole) {
        return res.status(403).json({ error: 'Forbidden: Only HR can view pending requests' });
      }

      const requests = await storage.getPendingAddressChangeRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/address-change-requests/:id/approve', async (req, res) => {
    try {
      // Get authenticated user ID from session (DO NOT trust client-supplied reviewerId)
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Route-level authorization check (first layer)
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      if (!hasPrivilegedRole) {
        return res.status(403).json({ error: 'Forbidden: Only HR can approve requests' });
      }

      const { reviewNotes } = req.body;
      // Pass authenticated session userId to storage (second layer verifies again)
      const request = await storage.approveAddressChangeRequest(req.params.id, userId, reviewNotes);
      res.json(request);
    } catch (error: any) {
      // Log security-related errors
      if (error.message?.includes('Forbidden')) {
        console.error(`[Security] Address approval denied: ${error.message}`);
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/address-change-requests/:id/reject', async (req, res) => {
    try {
      // Get authenticated user ID from session (DO NOT trust client-supplied reviewerId)
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Route-level authorization check (first layer)
      const hasPrivilegedRole = await canManageAnnouncements(userId);
      if (!hasPrivilegedRole) {
        return res.status(403).json({ error: 'Forbidden: Only HR can reject requests' });
      }

      const { reviewNotes } = req.body;
      // Pass authenticated session userId to storage (second layer verifies again)
      const request = await storage.rejectAddressChangeRequest(req.params.id, userId, reviewNotes);
      res.json(request);
    } catch (error: any) {
      // Log security-related errors
      if (error.message?.includes('Forbidden')) {
        console.error(`[Security] Address rejection denied: ${error.message}`);
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Employee routes
  // Note: Specific routes must come before parametric routes
  app.get('/api/employees/directory', async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const employees = await storage.getEmployeesWithProfiles();
      
      // Get current user's employee record to determine their role, department, and email
      const currentUserEmployee = employees.find((e: any) => e.userId === userId);
      const viewerRole = currentUserEmployee?.profile?.role || currentUserEmployee?.role || 'Employee';
      const viewerDepartment = currentUserEmployee?.profile?.department || currentUserEmployee?.department || '';
      const viewerEmail = currentUserEmployee?.profile?.email || '';
      
      // Determine if viewer can see full profiles (specific users + privileged roles)
      // Allowed: HR Staff, Product Owner role, Demo Account, Robert Sala
      const privilegedEmails = ['demo@hrstudio360.com', 'robertsala@gmail.com'];
      const privilegedRoles = ['HR Manager', 'HR', 'Product Owner'];
      const privilegedDepartments = ['HR'];
      const canViewFullProfiles = 
        privilegedEmails.includes(viewerEmail) ||
        privilegedRoles.includes(viewerRole) || 
        privilegedDepartments.includes(viewerDepartment);
      
      // Format each employee with role-based field filtering
      const formattedEmployees = employees.map((employee: any) => {
        // For authorized viewers (HR/Product Owner/Demo/Robert Sala), return full profile
        if (canViewFullProfiles) {
          return {
            ...employee,
            employeeRecordId: employee.id,
            name: employee.profile ? 
              `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() : 
              'Unknown',
            firstName: employee.profile?.firstName || '',
            lastName: employee.profile?.lastName || '',
            email: employee.profile?.email || '',
            phone: employee.profile?.phone || '',
            avatarUrl: null,
            profileImage: employee.profile?.profilePicture || null,
            location: employee.profile?.city && employee.profile?.state 
              ? `${employee.profile.city}, ${employee.profile.state}` 
              : null,
            address: employee.profile?.address || null,
            city: employee.profile?.city || null,
            state: employee.profile?.state || null,
            zipCode: employee.profile?.zipCode || null,
            managerName: employee.profile?.managerName || 'Not assigned',
            emergencyContact: {
              firstName: employee.profile?.emergencyContactFirstName || '',
              lastName: employee.profile?.emergencyContactLastName || '',
              middleName: employee.profile?.emergencyContactMiddleName || '',
              relationship: employee.profile?.emergencyContactRelationship || '',
              phone: employee.profile?.emergencyContactPhone || ''
            }
          };
        }

        // For regular employees, return whitelisted fields only (no salary, emergency contact, etc.)
        return {
          // Whitelist: only public employee record fields
          id: employee.id,
          userId: employee.userId,
          employeeId: employee.employeeId,
          status: employee.status,
          employeeRecordId: employee.id,
          
          // Filtered profile object with only public fields
          profile: {
            firstName: employee.profile?.firstName || '',
            lastName: employee.profile?.lastName || '',
            email: employee.profile?.email || '',
            phone: employee.profile?.phone || '',
            department: employee.profile?.department || null,
            role: employee.profile?.role || null,
            city: employee.profile?.city || null,
            state: employee.profile?.state || null,
            profilePicture: employee.profile?.profilePicture || null,
          },
          
          // Computed/formatted fields
          name: employee.profile ? 
            `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() : 
            'Unknown',
          firstName: employee.profile?.firstName || '',
          lastName: employee.profile?.lastName || '',
          email: employee.profile?.email || '',
          phone: employee.profile?.phone || '',
          avatarUrl: null,
          profileImage: employee.profile?.profilePicture || null,
          location: employee.profile?.city && employee.profile?.state 
            ? `${employee.profile.city}, ${employee.profile.state}` 
            : null
          
          // Explicitly excluded: salary, startDate, employmentType, managerId, departmentId, jobTitleId,
          // address, zipCode, emergencyContact*, hireDate, and other sensitive fields
        };
      });
      
      res.json(formattedEmployees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get employee by userId (instead of employee ID)
  app.get('/api/employees/user/:userId', async (req, res) => {
    try {
      const employees = await storage.getEmployeesWithProfiles();
      const employee = employees.find((e: any) => e.userId === req.params.userId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // Format employee data to include name for frontend compatibility
      // IMPORTANT: Keep employee.id (the employees table UUID) for PATCH operations
      const formattedEmployee = {
        ...employee,
        employeeRecordId: employee.id, // Explicitly expose employees table ID for updates
        name: employee.profile ? 
          `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() : 
          'Unknown',
        firstName: employee.profile?.firstName || '',
        lastName: employee.profile?.lastName || '',
        email: employee.profile?.email || '',
        phone: employee.profile?.phone || '',
        avatarUrl: null, // Keep null to avoid duplicating base64 data (use profileImage instead)
        // Include address fields from profiles table
        address: employee.profile?.address || null,
        city: employee.profile?.city || null,
        state: employee.profile?.state || null,
        zipCode: employee.profile?.zipCode || null,
        // Include manager name from profiles table
        managerName: employee.profile?.managerName || 'Not assigned',
        // Include emergency contact from profiles table (always return object even when blank)
        emergencyContact: {
          firstName: employee.profile?.emergencyContactFirstName || '',
          lastName: employee.profile?.emergencyContactLastName || '',
          middleName: employee.profile?.emergencyContactMiddleName || '',
          relationship: employee.profile?.emergencyContactRelationship || '',
          phone: employee.profile?.emergencyContactPhone || ''
        },
        // Include profile picture (base64 data from profiles table)
        profileImage: employee.profile?.profilePicture || null
      };
      
      res.json(formattedEmployee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees/:id', async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const validated = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validated);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/employees/:id', async (req, res) => {
    try {
      // Only allow updating managerId for now
      const { managerId } = req.body;
      
      if (managerId !== undefined && managerId !== null && typeof managerId !== 'string') {
        return res.status(400).json({ error: 'managerId must be a string or null' });
      }

      const updateData: Partial<import('../shared/schema.js').InsertEmployee> = {};
      if (managerId !== undefined) {
        updateData.managerId = managerId || null;
      }

      const employee = await storage.updateEmployee(req.params.id, updateData);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found. Please check the employee ID.' });
      }
      res.json(employee);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Leave request routes
  app.get('/api/leave-requests', async (req, res) => {
    try {
      const requests = await storage.getLeaveRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/leave-requests', async (req, res) => {
    try {
      const validated = insertLeaveRequestSchema.parse(req.body);
      const request = await storage.createLeaveRequest(validated);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/leave-requests/:id', async (req, res) => {
    try {
      const request = await storage.updateLeaveRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leave balance routes
  app.get('/api/leave-balances', async (req, res) => {
    try {
      const balances = await storage.getLeaveBalances();
      res.json(balances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/leave-balances/employee/:employeeId', async (req, res) => {
    try {
      const balance = await storage.getLeaveBalanceByEmployeeId(req.params.employeeId);
      if (!balance) {
        return res.status(404).json({ error: 'Leave balance not found' });
      }
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/leave-balances', async (req, res) => {
    try {
      const validated = insertLeaveBalanceSchema.parse(req.body);
      const balance = await storage.createLeaveBalance(validated);
      res.status(201).json(balance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/leave-balances/:id', async (req, res) => {
    try {
      const balance = await storage.updateLeaveBalance(req.params.id, req.body);
      if (!balance) {
        return res.status(404).json({ error: 'Leave balance not found' });
      }
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Candidate routes
  app.get('/api/candidates', async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/candidates/:id', async (req, res) => {
    try {
      const candidate = await storage.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/candidates', async (req, res) => {
    try {
      const validated = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(validated);
      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/candidates/:id', async (req, res) => {
    try {
      const candidate = await storage.updateCandidate(req.params.id, req.body);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ================================
  // ATS (APPLICANT TRACKING SYSTEM)
  // ================================

  // Job Postings - PUBLIC endpoints (no authentication required)
  app.get('/api/public/careers', async (req, res) => {
    try {
      const activeJobs = await storage.getActiveJobPostings();
      res.json(activeJobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/public/careers/:id', async (req, res) => {
    try {
      const job = await storage.getJobPostingById(req.params.id);
      if (!job || !job.isPublic || job.status !== 'active') {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      
      // Increment view count
      await storage.incrementJobPostingViews(req.params.id);
      
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public Application Submission (no authentication required)
  app.post('/api/public/careers/:jobId/apply', async (req, res) => {
    try {
      const { insertApplicationSchema, insertCandidateSchema, insertResumeDataSchema } = await import('../shared/schema.js');
      
      const { candidate, application, resumeData } = req.body;
      
      // Verify job exists and is active
      const job = await storage.getJobPostingById(req.params.jobId);
      if (!job || !job.isPublic || job.status !== 'active') {
        return res.status(404).json({ error: 'Job posting not found or no longer accepting applications' });
      }
      
      // Check if candidate already applied to this job
      const existingCandidate = await storage.getCandidateByEmail(candidate.email);
      let candidateRecord;
      
      if (existingCandidate) {
        candidateRecord = existingCandidate;
        
        // Check for duplicate application
        const existingApplication = await storage.getApplicationByJobAndCandidate(
          req.params.jobId,
          existingCandidate.id
        );
        
        if (existingApplication) {
          return res.status(409).json({ 
            error: 'You have already applied to this position',
            applicationId: existingApplication.id
          });
        }
      } else {
        // Create new candidate
        const validatedCandidate = insertCandidateSchema.parse(candidate);
        candidateRecord = await storage.createCandidate(validatedCandidate);
      }
      
      // Get default interview stage for this job
      const defaultStage = await storage.getDefaultInterviewStage(req.params.jobId);
      
      // Create application
      const validatedApplication = insertApplicationSchema.parse({
        ...application,
        jobPostingId: req.params.jobId,
        candidateId: candidateRecord.id,
        currentStageId: defaultStage?.id || null,
        status: 'applied'
      });
      
      const applicationRecord = await storage.createApplication(validatedApplication);
      
      // Store parsed resume data if provided
      if (resumeData) {
        const validatedResumeData = insertResumeDataSchema.parse({
          ...resumeData,
          applicationId: applicationRecord.id,
          candidateId: candidateRecord.id
        });
        await storage.createResumeData(validatedResumeData);
      }
      
      // Increment application count
      await storage.incrementJobPostingApplications(req.params.jobId);
      
      // Log activity
      await storage.createApplicationActivityLog({
        applicationId: applicationRecord.id,
        userId: null,
        activityType: 'application_submitted',
        description: 'Application submitted',
        metadata: { source: application.sourceId }
      });
      
      res.status(201).json({
        message: 'Application submitted successfully',
        applicationId: applicationRecord.id,
        candidateId: candidateRecord.id
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid application data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Job Postings - AUTHENTICATED endpoints
  app.get('/api/jobs', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const jobs = await storage.getAllJobPostings();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const job = await storage.getJobPostingById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { insertJobPostingSchema } = await import('../shared/schema.js');
      const validated = insertJobPostingSchema.parse({
        ...req.body,
        postedBy: userId
      });
      
      const job = await storage.createJobPosting(validated);
      
      // Create default interview stages for the job
      await storage.createDefaultInterviewStages(job.id);
      
      res.status(201).json(job);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid job posting data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/jobs/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const job = await storage.updateJobPosting(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Applications
  app.get('/api/applications', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { jobId } = req.query;
      
      if (jobId) {
        const applications = await storage.getApplicationsByJob(jobId as string);
        res.json(applications);
      } else {
        const applications = await storage.getAllApplications();
        res.json(applications);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/applications/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const application = await storage.getApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/applications/:id/stage', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { stageId } = req.body;
      const application = await storage.getApplicationById(req.params.id);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      // Record stage transition
      await storage.createApplicationStageTransition({
        applicationId: req.params.id,
        fromStageId: application.currentStageId,
        toStageId: stageId,
        movedBy: req.session.userId
      });
      
      // Update application
      const updated = await storage.updateApplication(req.params.id, {
        currentStageId: stageId,
        lastActivityAt: new Date()
      });
      
      // Log activity
      await storage.createApplicationActivityLog({
        applicationId: req.params.id,
        userId: userId,
        activityType: 'stage_change',
        description: 'Application stage changed',
        oldValue: application.currentStageId,
        newValue: stageId
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume parsing with AI
  app.post('/api/applications/:id/parse-resume', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { resumeText } = req.body;
      
      if (!resumeText) {
        return res.status(400).json({ error: 'Resume text is required' });
      }
      
      // Call AI resume parser (to be implemented)
      const { parseResumeWithAI } = await import('./ai-resume-parser');
      const parsedData = await parseResumeWithAI(resumeText);
      
      // Store parsed data
      const application = await storage.getApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      const { insertResumeDataSchema } = await import('../shared/schema.js');
      const resumeData = insertResumeDataSchema.parse({
        ...parsedData,
        applicationId: req.params.id,
        candidateId: application.candidateId
      });
      
      const stored = await storage.createResumeData(resumeData);
      
      res.json(stored);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Interview Stages
  app.get('/api/jobs/:jobId/stages', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const stages = await storage.getInterviewStagesByJob(req.params.jobId);
      res.json(stages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jobs/:jobId/stages', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { insertInterviewStageSchema } = await import('../shared/schema.js');
      const validated = insertInterviewStageSchema.parse({
        ...req.body,
        jobPostingId: req.params.jobId
      });
      
      const stage = await storage.createInterviewStage(validated);
      res.status(201).json(stage);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid stage data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Team Assignments
  app.get('/api/jobs/:jobId/team', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const team = await storage.getTeamAssignmentsByJob(req.params.jobId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/jobs/:jobId/team', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { insertTeamAssignmentSchema } = await import('../shared/schema.js');
      const validated = insertTeamAssignmentSchema.parse({
        ...req.body,
        jobPostingId: req.params.jobId,
        assignedBy: userId
      });
      
      const assignment = await storage.createTeamAssignment(validated);
      res.status(201).json(assignment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid assignment data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Expense Category routes
  app.get('/api/expense-categories', async (req, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/expense-categories/:id', async (req, res) => {
    try {
      const category = await storage.getExpenseCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Expense category not found' });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Expense routes
  app.get('/api/expenses', async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const validated = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validated);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // === CHAT ROUTES ===
  
  // Chat Channel routes
  app.get('/api/chat/channels', async (req, res) => {
    try {
      const channels = await storage.getChatChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/channels/:id', async (req, res) => {
    try {
      const channel = await storage.getChatChannelById(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels', async (req, res) => {
    try {
      const validated = insertChatChannelSchema.parse(req.body);
      const channel = await storage.createChatChannel(validated);
      res.status(201).json(channel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/chat/channels/:id', async (req, res) => {
    try {
      console.log('[PATCH channel] ID:', req.params.id, 'Body:', req.body);
      const channel = await storage.updateChatChannel(req.params.id, req.body);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      res.json(channel);
    } catch (error: any) {
      console.error('[PATCH channel] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update channel' });
    }
  });

  // Channel Member routes
  app.get('/api/chat/channels/:channelId/members', async (req, res) => {
    try {
      const members = await storage.getChannelMembers(req.params.channelId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/members', async (req, res) => {
    try {
      const memberData = {
        ...req.body,
        channelId: req.params.channelId
      };
      const validated = insertChannelMemberSchema.parse(memberData);
      const member = await storage.addChannelMember(validated);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/chat/channels/:channelId/members/:userId', async (req, res) => {
    try {
      await storage.removeChannelMember(req.params.channelId, req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/mark-read', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      await storage.updateChannelMemberLastRead(req.params.channelId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat Message routes
  app.get('/api/chat/channels/:channelId/messages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getChatMessages(req.params.channelId, limit);
      
      // Populate sender information for each message
      const messagesWithSender = await Promise.all(
        messages.map(async (message) => {
          if (message.senderId) {
            const sender = await storage.getProfileById(message.senderId);
            return {
              ...message,
              sender: sender ? {
                id: sender.id,
                first_name: sender.firstName,
                last_name: sender.lastName,
                email: sender.email
              } : null
            };
          }
          return { ...message, sender: null };
        })
      );
      
      res.json(messagesWithSender);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/messages/:id', async (req, res) => {
    try {
      const message = await storage.getChatMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/channels/:channelId/messages', async (req, res) => {
    try {
      // SECURITY: Validate channel type before accepting plainContent
      // Only ai_assistant channels are allowed to send plainContent
      const channel = await storage.getChatChannelById(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      // Extract plainContent for AI processing (before validation)
      // plainContent is not a database column, it's only used for AI analysis
      const plainContent = channel.channelType === 'ai_assistant' ? req.body.plainContent : null;
      
      // Prepare message data WITHOUT plainContent (not a database field)
      const messageData = {
        ...req.body,
        channelId: req.params.channelId
      };
      delete messageData.plainContent; // Always remove - not a database column
      
      console.log('[Chat] Creating message with data:', JSON.stringify(messageData, null, 2));
      const validated = insertChatMessageSchema.parse(messageData);
      console.log('[Chat] Validation successful');
      const message = await storage.createChatMessage(validated);
      
      // Broadcast new message via WebSocket to all connected clients
      const wsServer = app.get('wsServer');
      if (wsServer) {
        wsServer.broadcastToChannel(req.params.channelId, {
          type: 'new_message',
          payload: {
            id: message.id,
            channelId: message.channelId,
            senderId: message.senderId,
            content: message.encryptedContent,
            messageType: message.messageType,
            timestamp: message.createdAt,
            ...message
          }
        });
      }
      
      // Check if this is an AI Assistant channel and auto-respond
      // (channel already fetched above for security validation)
      if (channel.channelType === 'ai_assistant') {
        // Import AI response generator
        const { chatWithStudioAI } = await import('./ai-assistant.js');
        
        // Create AI response message with dedicated AI sender identity
        const AI_ASSISTANT_ID = '00000000-0000-0000-0000-000000000000';
        
        // Use plainContent (extracted above for security) if available, otherwise use encryptedContent
        const userMessage = plainContent || message.encryptedContent;
        
        // Get recent conversation history for context (last 10 messages)
        const recentMessages = await storage.getChatMessages(req.params.channelId, 10);
        
        // Build conversation history for AI (exclude current message)
        const conversationHistory = recentMessages
          .filter(msg => msg.id !== message.id)
          .reverse()
          .map(msg => ({
            role: (msg.senderId === AI_ASSISTANT_ID ? 'assistant' : 'user') as 'assistant' | 'user',
            content: msg.encryptedContent
          }));
        
        // Get userId from session for employee context
        const userId = (req.session as any)?.userId;
        
        // Generate AI response with conversation context and employee data
        const aiResponse = await chatWithStudioAI(userMessage, userId, conversationHistory);
        
        const aiMessageData = {
          channelId: req.params.channelId,
          senderId: AI_ASSISTANT_ID,
          encryptedContent: aiResponse,
          messageType: 'system'
        };
        
        const aiMessage = await storage.createChatMessage(aiMessageData);
        
        // Broadcast AI response
        if (wsServer) {
          wsServer.broadcastToChannel(req.params.channelId, {
            type: 'new_message',
            payload: {
              id: aiMessage.id,
              channelId: aiMessage.channelId,
              senderId: aiMessage.senderId,
              content: aiMessage.encryptedContent,
              messageType: aiMessage.messageType,
              timestamp: aiMessage.createdAt,
              ...aiMessage
            }
          });
        }
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('[Chat] Message creation failed:', error);
      if (error.issues) {
        console.error('[Chat] Zod validation errors:', JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: error.message, details: error.issues });
    }
  });

  app.patch('/api/chat/messages/:id', async (req, res) => {
    try {
      // SECURITY: Validate channel type before accepting plainContent in updates
      // First get the existing message to find its channel
      const existingMessage = await storage.getChatMessageById(req.params.id);
      if (!existingMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Get the channel to check its type
      const channel = await storage.getChatChannelById(existingMessage.channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      // SECURITY: Remove plainContent from update if channel is not ai_assistant
      // This prevents encryption bypass on message edits
      const updateData = { ...req.body };
      if (channel.channelType !== 'ai_assistant') {
        delete updateData.plainContent;
      }
      
      const message = await storage.updateChatMessage(req.params.id, updateData);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/chat/messages/:id', async (req, res) => {
    try {
      await storage.deleteChatMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Message Reaction routes
  app.get('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const reactions = await storage.getMessageReactions(req.params.messageId);
      res.json(reactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const reactionData = {
        messageId: req.params.messageId,
        ...req.body
      };
      const validated = insertMessageReactionSchema.parse(reactionData);
      const reaction = await storage.addMessageReaction(validated);
      res.status(201).json(reaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/chat/messages/:messageId/reactions', async (req, res) => {
    try {
      const { emoji, userId } = req.body;
      if (!emoji || !userId) {
        return res.status(400).json({ error: 'emoji and userId are required' });
      }
      await storage.removeMessageReaction(req.params.messageId, userId, emoji);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Typing Indicator routes
  app.post('/api/chat/channels/:channelId/typing', async (req, res) => {
    try {
      const { userId, isTyping } = req.body;
      
      if (!userId || isTyping === undefined) {
        console.error('[Typing] Missing required fields:', { userId, isTyping });
        return res.status(400).json({ error: 'userId and isTyping are required' });
      }
      
      if (isTyping) {
        const indicatorData = {
          channelId: req.params.channelId,
          userId
        };
        
        const validated = insertTypingIndicatorSchema.parse(indicatorData);
        const indicator = await storage.setTypingIndicator(validated);
        res.json(indicator);
      } else {
        await storage.removeTypingIndicator(req.params.channelId, userId);
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error('[Typing] Error:', {
        message: error.message,
        channelId: req.params.channelId,
        body: req.body,
        stack: error.stack
      });
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/channels/:channelId/typing', async (req, res) => {
    try {
      const indicators = await storage.getTypingIndicators(req.params.channelId);
      res.json(indicators);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Presence routes
  app.post('/api/chat/presence/:userId', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }
      const presenceData = {
        userId: req.params.userId,
        status,
        lastSeenAt: new Date()
      };
      const validated = insertUserPresenceSchema.parse(presenceData);
      const presence = await storage.upsertUserPresence(validated);
      res.json(presence);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/chat/presence/:userId', async (req, res) => {
    try {
      const presence = await storage.getUserPresence(req.params.userId);
      res.json(presence || { userId: req.params.userId, status: 'offline' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === CALL ROUTES ===

  // Start a new call
  app.post('/api/calls/start', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { channelId, callType } = req.body;
      if (!channelId || !callType) {
        return res.status(400).json({ error: 'channelId and callType are required' });
      }

      if (callType !== 'voice' && callType !== 'video') {
        return res.status(400).json({ error: 'callType must be "voice" or "video"' });
      }

      // Create call session
      const callSessionData = {
        channelId,
        callerId: userId,
        callType,
        status: 'ringing' as const,
        startedAt: new Date()
      };
      const validated = insertCallSessionSchema.parse(callSessionData);
      const callSession = await storage.createCallSession(validated);

      // Add caller as participant with status 'connected'
      await storage.addCallParticipant({
        callSessionId: callSession.id,
        userId,
        status: 'connected',
        joinedAt: new Date()
      });

      // Get all channel members and add them as participants with status 'calling'
      const channelMembers = await storage.getChannelMembers(channelId);
      for (const member of channelMembers) {
        if (member.userId !== userId) {
          await storage.addCallParticipant({
            callSessionId: callSession.id,
            userId: member.userId,
            status: 'calling'
          });
        }
      }

      res.status(201).json(callSession);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Join an existing call
  app.post('/api/calls/join', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.body;
      if (!callId) {
        return res.status(400).json({ error: 'callId is required' });
      }

      // Get all participants for this call
      const participants = await storage.getCallParticipants(callId);
      const userParticipant = participants.find(p => p.userId === userId);

      if (!userParticipant) {
        return res.status(404).json({ error: 'Participant not found in this call' });
      }

      // Update participant status to 'connected' with joinedAt timestamp
      await storage.updateCallParticipant(userParticipant.id, {
        status: 'connected',
        joinedAt: new Date()
      });

      // Update call session status to 'active'
      await storage.updateCallSession(callId, {
        status: 'active'
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // End a call
  app.post('/api/calls/end', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.body;
      if (!callId) {
        return res.status(400).json({ error: 'callId is required' });
      }

      // Get all participants for this call
      const participants = await storage.getCallParticipants(callId);
      const userParticipant = participants.find(p => p.userId === userId);

      if (!userParticipant) {
        return res.status(404).json({ error: 'Participant not found in this call' });
      }

      // Update current user's participant status to 'disconnected' with leftAt timestamp
      await storage.updateCallParticipant(userParticipant.id, {
        status: 'disconnected',
        leftAt: new Date()
      });

      // Get fresh participant list to check if all are disconnected
      const updatedParticipants = await storage.getCallParticipants(callId);
      const allDisconnected = updatedParticipants.every(p => p.status === 'disconnected');

      if (allDisconnected) {
        // Get call session to calculate duration
        const callSession = await storage.getCallSessionById(callId);
        if (callSession && callSession.startedAt) {
          const duration = Math.floor((Date.now() - new Date(callSession.startedAt).getTime()) / 1000);
          await storage.updateCallSession(callId, {
            status: 'ended',
            endedAt: new Date(),
            duration
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decline an incoming call
  app.post('/api/calls/decline', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.body;
      if (!callId) {
        return res.status(400).json({ error: 'callId is required' });
      }

      // Get all participants for this call
      const participants = await storage.getCallParticipants(callId);
      const userParticipant = participants.find(p => p.userId === userId);

      if (!userParticipant) {
        return res.status(404).json({ error: 'Participant not found in this call' });
      }

      // Update participant status to 'disconnected'
      await storage.updateCallParticipant(userParticipant.id, {
        status: 'disconnected'
      });

      // Update call session status to 'declined'
      await storage.updateCallSession(callId, {
        status: 'declined'
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send WebRTC signaling data
  app.post('/api/calls/signal', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId, signalType, signalData, toUserId } = req.body;
      if (!callId || !signalType || !signalData) {
        return res.status(400).json({ error: 'callId, signalType, and signalData are required' });
      }

      if (!['offer', 'answer', 'ice-candidate'].includes(signalType)) {
        return res.status(400).json({ error: 'signalType must be "offer", "answer", or "ice-candidate"' });
      }

      // Create signaling record
      const signalingRecord = {
        callSessionId: callId,
        fromUserId: userId,
        toUserId: toUserId || null,
        signalType,
        signalData
      };
      const validated = insertCallSignalingSchema.parse(signalingRecord);
      await storage.createCallSignal(validated);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get signaling data for a call
  app.get('/api/calls/signals/:callId', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.params;
      const fromTime = req.query.fromTime ? new Date(req.query.fromTime as string) : undefined;

      const signals = await storage.getCallSignals(callId, fromTime);
      res.json(signals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get incoming calls for current user
  app.get('/api/calls/incoming', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Find call participants where userId matches current user and status is 'calling'
      // Join with call sessions to get call details
      const incomingCalls = await db
        .select({
          callId: callSessions.id,
          channelId: callSessions.channelId,
          callerId: callSessions.callerId,
          callType: callSessions.callType,
          status: callSessions.status,
          startedAt: callSessions.startedAt,
          participantId: callParticipants.id,
          participantStatus: callParticipants.status
        })
        .from(callParticipants)
        .innerJoin(callSessions, eq(callParticipants.callSessionId, callSessions.id))
        .where(
          and(
            eq(callParticipants.userId, userId),
            eq(callParticipants.status, 'calling')
          )
        );

      res.json(incomingCalls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === CHANGELOG ROUTES ===

  // Change Log routes
  app.get('/api/changelog', async (req, res) => {
    try {
      const filters = {
        changeType: req.query.changeType as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getChangeLogs(filters, limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/changelog/seed', async (req, res) => {
    try {
      const { seedChangeLog } = await import('./seed-changelog.js');
      const result = await seedChangeLog();
      
      if (result.seeded) {
        return res.json({
          message: 'Successfully seeded change log with historical entries',
          count: result.count,
          seeded: true
        });
      } else {
        return res.json({
          message: 'Change log already contains entries',
          count: result.count,
          skipped: true
        });
      }
    } catch (error: any) {
      console.error('Error seeding change log:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/changelog/:id', async (req, res) => {
    try {
      const log = await storage.getChangeLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'Change log not found' });
      }
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog', async (req, res) => {
    try {
      const validated = insertChangeLogSchema.parse(req.body);
      const log = await storage.createChangeLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/changelog/:id', async (req, res) => {
    try {
      const log = await storage.updateChangeLog(req.params.id, req.body);
      if (!log) {
        return res.status(404).json({ error: 'Change log not found' });
      }
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Historical Changes routes
  app.get('/api/changelog/historical', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const changes = await storage.getHistoricalChanges(limit);
      res.json(changes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog/historical', async (req, res) => {
    try {
      const validated = insertHistoricalChangeSchema.parse(req.body);
      const change = await storage.createHistoricalChange(validated);
      res.status(201).json(change);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Change Notification routes
  app.get('/api/changelog/notifications/:userId', async (req, res) => {
    try {
      const notifications = await storage.getChangeNotifications(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/changelog/notifications', async (req, res) => {
    try {
      const validated = insertChangeNotificationSchema.parse(req.body);
      const notification = await storage.createChangeNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/changelog/notifications/mark-read', async (req, res) => {
    try {
      const { changeLogId, userId } = req.body;
      if (!changeLogId || !userId) {
        return res.status(400).json({ error: 'changeLogId and userId are required' });
      }
      await storage.markChangeNotificationRead(changeLogId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/expenses/:id', async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/expenses/:id', async (req, res) => {
    try {
      const expense = await storage.updateExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication endpoints with session management
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if profile exists
      let profile = await storage.getProfileByEmail(email);
      
      // Demo account passwordless login for backward compatibility
      if (email === 'demo@hrstudio360.com' && !password) {
        if (!profile) {
          profile = await storage.createProfile({
            email,
            firstName: 'Demo',
            lastName: 'User',
            role: 'Product Manager',
            department: 'Product'
          });
        }
        
        // Safety check (should always be defined at this point)
        if (!profile) {
          return res.status(500).json({ error: 'Failed to create demo profile' });
        }
        
        // Capture profile for closure
        const demoProfile = profile;
        
        // Regenerate session for demo login
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ error: 'Login failed' });
          }
          
          (req.session as any).userId = demoProfile.id;
          
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ error: 'Login failed' });
            }
            res.json({ user: demoProfile });
          });
        });
        return;
      }
      
      // Password-based authentication
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      if (!profile) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Get auth credentials
      const authCredential = await storage.getAuthCredentialByProfileId(profile.id);
      if (!authCredential) {
        console.error('[Login] No auth_credentials found for profile:', profile.id, 'email:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('[Login] Found auth credentials for:', email);
      console.log('[Login] Hash starts with:', authCredential.passwordHash.substring(0, 20));
      console.log('[Login] Hash type:', authCredential.passwordHash.startsWith('$argon2') ? 'Argon2' : authCredential.passwordHash.startsWith('$2b$') ? 'BCrypt' : 'Unknown');
      
      // Check if account is locked
      if (isAccountLocked(authCredential.lockedUntil)) {
        const lockTime = new Date(authCredential.lockedUntil!);
        const minutesRemaining = Math.ceil((lockTime.getTime() - Date.now()) / (60 * 1000));
        return res.status(403).json({ 
          error: `Account locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.` 
        });
      }
      
      // Verify password
      console.log('[Login] Attempting password verification...');
      const isValidPassword = await verifyPassword(authCredential.passwordHash, password);
      console.log('[Login] Password verification result:', isValidPassword);
      
      if (!isValidPassword) {
        // Increment failed attempts
        await storage.incrementFailedLoginAttempts(profile.id);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Successful login - reset failed attempts
      await storage.resetFailedLoginAttempts(profile.id);
      
      // Regenerate session to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        // Store user ID in new session
        (req.session as any).userId = profile.id;
        
        // Save session before responding
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Login failed' });
          }
          res.json({ user: profile });
        });
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
    try {
      const { email, firstName, lastName, password, preferredLanguage } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: 'Email, first name, last name, and password are required' });
      }
      
      // Validate password
      const passwordValidation = validatePassword(password, email);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'Password does not meet requirements', 
          details: passwordValidation.errors 
        });
      }
      
      // Check if profile already exists
      const existingProfile = await storage.getProfileByEmail(email);
      if (existingProfile) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create new profile
      const profile = await storage.createProfile({
        email,
        firstName,
        lastName,
        role: 'employee',
        department: 'General',
        languagePreference: preferredLanguage || 'en'
      });
      
      // Create auth credentials
      await storage.createAuthCredential({
        profileId: profile.id,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null
      });
      
      // Log the user in immediately by creating a session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Signup successful but login failed' });
        }
        
        (req.session as any).userId = profile.id;
        
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Signup successful but login failed' });
          }
          res.status(201).json({ user: profile });
        });
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.json({ user: null });
      }
      
      const profile = await storage.getProfileById(userId);
      
      if (!profile) {
        return res.json({ user: null });
      }
      
      res.json({ user: profile });
    } catch (error: any) {
      console.error('Session check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Password reset - request reset email
  app.post('/api/auth/forgot-password', authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const profile = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
      
      if (!profile || profile.length === 0) {
        return res.json({ 
          success: true, 
          message: 'If an account exists with this email, a password reset link has been sent.' 
        });
      }

      const user = profile[0];
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        profileId: user.id,
        token,
        expiresAt,
        used: false
      });

      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(RESEND_API_KEY);

          // Use explicit PRODUCTION_URL if set, otherwise fall back to REPLIT_DOMAINS
          const productionUrl = process.env.PRODUCTION_URL;
          const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
          const primaryDomain = productionUrl || domains[0] || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
          const isHttps = primaryDomain !== 'localhost:5000';
          const resetUrl = `${isHttps ? 'https' : 'http'}://${primaryDomain}/reset-password?token=${token}`;

          console.log('[Password Reset] Attempting to send email to:', email);
          console.log('[Password Reset] Reset URL:', resetUrl);

          const result = await resend.emails.send({
            from: 'HRStudio360 <onboarding@resend.dev>',
            to: email,
            subject: 'Password Reset Request - HRStudio360',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello ${user.firstName || 'there'},</p>
                <p>We received a request to reset your password for your HRStudio360 account.</p>
                <p>Click the button below to reset your password. This link will expire in 30 minutes.</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>Troubleshooting Tip:</strong> If the reset page appears blank or doesn't load properly, try temporarily disabling browser extensions like ad blockers or privacy tools (uBlock Origin, Privacy Badger, etc.), or try a different browser.
                  </p>
                </div>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  ${resetUrl}
                </p>
              </div>
            `
          });

          console.log('[Password Reset] Email sent successfully:', result);
        } catch (emailError: any) {
          console.error('[Password Reset] Failed to send email:', emailError.message);
          console.error('[Password Reset] Full error:', emailError);
        }
      } else {
        console.warn('[Password Reset] RESEND_API_KEY not configured - email not sent');
      }

      res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Password reset - complete reset with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      const resetToken = await db.select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (!resetToken || resetToken.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const tokenData = resetToken[0];

      if (tokenData.used) {
        return res.status(400).json({ error: 'This reset link has already been used' });
      }

      if (new Date() > new Date(tokenData.expiresAt)) {
        return res.status(400).json({ error: 'This reset link has expired' });
      }

      const validationResult = validatePassword(newPassword);
      if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.errors.join(', ') });
      }

      const hashedPassword = await hashPassword(newPassword);

      console.log('[Password Reset] Updating password for profile ID:', tokenData.profileId);
      console.log('[Password Reset] New hash starts with:', hashedPassword.substring(0, 20));

      const updateResult = await db.update(authCredentials)
        .set({ 
          passwordHash: hashedPassword,
          passwordUpdatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null
        })
        .where(eq(authCredentials.profileId, tokenData.profileId))
        .returning();

      console.log('[Password Reset] Update completed, rows affected:', updateResult.length);
      if (updateResult.length === 0) {
        console.error('[Password Reset] WARNING: No rows were updated! Profile ID might not have auth_credentials record');
      }

      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, tokenData.id));

      const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await db.insert(passwordAuditLog).values({
        profileId: tokenData.profileId,
        action: 'password_reset',
        method: 'email_reset_link',
        adminId: null,
        ipAddress,
        userAgent,
        success: true
      });

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Password change - authenticated users changing their own password
  app.post('/api/auth/password/change', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Current password, new password, and confirm password are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm password do not match' });
      }

      // Get user profile
      const profile = await storage.getProfileById(userId);
      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Get auth credentials
      const authCredential = await storage.getAuthCredentialByProfileId(userId);
      if (!authCredential) {
        return res.status(404).json({ error: 'Authentication credentials not found' });
      }

      // Check if account is locked
      if (authCredential.lockedUntil && new Date(authCredential.lockedUntil) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(authCredential.lockedUntil).getTime() - Date.now()) / 60000);
        return res.status(423).json({ 
          error: `Account is locked. Please try again in ${remainingMinutes} minutes.` 
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(authCredential.passwordHash, currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword, profile.email);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'New password does not meet requirements', 
          details: passwordValidation.errors 
        });
      }

      // Check if new password is same as current
      const isSamePassword = await verifyPassword(authCredential.passwordHash, newPassword);
      if (isSamePassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and reset failed attempts
      await db.update(authCredentials)
        .set({ 
          passwordHash: hashedPassword,
          passwordUpdatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null
        })
        .where(eq(authCredentials.profileId, userId));

      // Log the password change
      const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await db.insert(passwordAuditLog).values({
        profileId: userId,
        action: 'password_change',
        method: 'user_initiated',
        adminId: null,
        ipAddress,
        userAgent,
        success: true
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Weather API proxy endpoint
  app.get('/api/weather/:lat/:lon', async (req, res) => {
    try {
      const { lat, lon } = req.params;
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HR-Studio-Weather-Widget/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('met.no API error:', response.status, errorText);
        return res.status(response.status).json({ error: 'Weather API error' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Weather proxy error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Onboarding email endpoint (migrated from Supabase Edge Function)
  app.post('/api/onboarding/send-email', async (req, res) => {
    try {
      const { to, firstName, lastName, position, department, startDate, managerName } = req.body;
      
      if (!to || !firstName || !lastName || !position || !startDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // In production, integrate with an email service like Resend
      // For now, log the email details
      console.log('Onboarding email would be sent to:', to);
      console.log(`Subject: Welcome to the Team, ${firstName}!`);
      
      res.json({
        success: true,
        message: `Email prepared for ${to} (Email service not configured)`,
        preview: {
          to,
          subject: `Welcome to the Team, ${firstName}! 🎉`,
          position,
          department,
          startDate: formattedStartDate,
          managerName
        }
      });
    } catch (error: any) {
      console.error('Error in send-onboarding-email:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // AI Assistant chat endpoint
  app.post('/api/ai-assistant/chat', async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const userId = (req.session as any)?.userId;

      const response = await chatWithStudioAI(message, userId);

      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in AI assistant:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration Badge routes
  app.get('/api/celebration-badges', async (req, res) => {
    try {
      const badges = await storage.getCelebrationBadges();
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/celebration-badges/years/:years', async (req, res) => {
    try {
      const badge = await storage.getCelebrationBadgeByYears(parseInt(req.params.years));
      if (!badge) {
        return res.status(404).json({ error: 'Badge not found' });
      }
      res.json(badge);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Earned Badge routes
  app.get('/api/earned-badges/:userId', async (req, res) => {
    try {
      const badges = await storage.getEarnedBadges(req.params.userId);
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/earned-badges', async (req, res) => {
    try {
      const validated = insertEarnedBadgeSchema.parse(req.body);
      const badge = await storage.createEarnedBadge(validated);
      res.status(201).json(badge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/earned-badges/mark-viewed', async (req, res) => {
    try {
      const { userId, badgeId } = req.body;
      if (!userId || !badgeId) {
        return res.status(400).json({ error: 'userId and badgeId are required' });
      }
      await storage.markBadgeViewed(userId, badgeId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration History routes
  app.post('/api/celebration-history', async (req, res) => {
    try {
      const validated = insertCelebrationHistorySchema.parse(req.body);
      const history = await storage.saveCelebrationHistory(validated);
      res.status(201).json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/celebration-history/dismiss', async (req, res) => {
    try {
      const { userId, type, date } = req.body;
      if (!userId || !type || !date) {
        return res.status(400).json({ error: 'userId, type, and date are required' });
      }
      await storage.markCelebrationDismissed(userId, type, date);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Celebration Notification routes
  app.get('/api/celebration-notifications/:userId', async (req, res) => {
    try {
      const notifications = await storage.getCelebrationNotifications(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/celebration-notifications', async (req, res) => {
    try {
      const validated = insertCelebrationNotificationSchema.parse(req.body);
      const notification = await storage.createCelebrationNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Fun Facts routes
  app.get('/api/fun-facts/random', async (req, res) => {
    try {
      const { amount, employeeId } = req.query;
      
      if (!amount || !employeeId) {
        return res.status(400).json({ error: 'amount and employeeId are required' });
      }

      const netPayAmount = parseFloat(amount as string);
      if (isNaN(netPayAmount)) {
        return res.status(400).json({ error: 'Invalid amount value' });
      }

      const recentFactIds = await storage.getRecentFunFactIds(employeeId as string, 10);

      const funFact = await storage.getRandomFunFact(
        netPayAmount,
        employeeId as string,
        recentFactIds
      );

      if (!funFact) {
        return res.status(404).json({ error: 'No fun fact found for the given amount' });
      }

      await storage.saveFunFactHistory(
        employeeId as string,
        funFact.id,
        funFact.factTemplate
      );

      res.json({ funFact });
    } catch (error: any) {
      console.error('Error getting random fun fact:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/fun-facts/manual', async (req, res) => {
    try {
      const { employeeId, amount } = req.body;

      if (!employeeId || !amount) {
        return res.status(400).json({ error: 'employeeId and amount are required' });
      }

      const netPayAmount = parseFloat(amount);
      if (isNaN(netPayAmount)) {
        return res.status(400).json({ error: 'Invalid amount value' });
      }

      const usageInfo = await storage.getDailyUsageInfo(employeeId);
      
      if (usageInfo.remaining <= 0) {
        return res.status(429).json({ 
          error: 'Daily limit reached',
          message: 'You have reached your daily limit of 3 manual fun fact generations',
          ...usageInfo
        });
      }

      const recentFactIds = await storage.getRecentFunFactIds(employeeId, 10);
      const funFact = await storage.getRandomFunFact(netPayAmount, employeeId, recentFactIds);
      
      if (!funFact) {
        return res.status(404).json({ error: 'No fun fact found for the given amount' });
      }

      await db.transaction(async () => {
        await storage.saveFunFactHistory(
          employeeId,
          funFact.id,
          funFact.factTemplate
        );
        
        await storage.trackManualFunFactGeneration(employeeId, funFact.id);
      });

      const updatedUsageInfo = await storage.getDailyUsageInfo(employeeId);

      res.json({
        funFact,
        usageInfo: updatedUsageInfo
      });
    } catch (error: any) {
      console.error('Error generating manual fun fact:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/fun-facts/daily-usage/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const usageInfo = await storage.getDailyUsageInfo(employeeId);
      
      res.json(usageInfo);
    } catch (error: any) {
      console.error('Error getting daily usage info:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/fun-facts/seed', async (req, res) => {
    try {
      const existingCount = await db.select().from(paycheckFunFacts);
      
      if (existingCount.length > 0) {
        return res.json({ 
          message: 'Fun fact templates already exist', 
          count: existingCount.length,
          skipped: true 
        });
      }

      const templates = [
        { category: 'animals', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could adopt {sheep} sheep with this paycheck. Welcome to shepherding!', enabled: true },
        { category: 'animals', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'With this paycheck, you could buy {chickens} chickens, {guineaPigs} guinea pigs, and start your own mini farm!', enabled: true },
        { category: 'education', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "That's {books} books for your library!", enabled: true },
        { category: 'education', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'Enough for {onlineCourses} online courses!', enabled: true },
        { category: 'entertainment', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could get {streamingMonths} months of streaming services!', enabled: true },
        { category: 'entertainment', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "That's {concertTickets} concert tickets. Time to rock out!", enabled: true },
        { category: 'entertainment', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could buy {gamingConsoles} gaming consoles!', enabled: true },
        { category: 'food', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "This paycheck buys {coffee} cups of coffee. That's a lot of caffeine!", enabled: true },
        { category: 'food', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'Enough for {avocadoToast} avocado toasts. Millennial dream!', enabled: true },
        { category: 'food', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'That could buy {pizzas} pizzas. Pizza party for everyone!', enabled: true },
        { category: 'quirky', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "That's enough to buy {telescopes} professional-grade telescopes. Stargazing party!", enabled: true },
        { category: 'quirky', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could buy {rubberDucks} rubber ducks. For debugging, of course!', enabled: true },
        { category: 'quirky', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "That's {fountainPens} fountain pens for your collection!", enabled: true },
        { category: 'sports', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could buy {bicycles} bicycles!', enabled: true },
        { category: 'sports', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'That covers {gymMonths} months of gym membership!', enabled: true },
        { category: 'technology', minAmount: '0.00', maxAmount: '100000.00', factTemplate: "That's enough for {smartphones} smartphones!", enabled: true },
        { category: 'technology', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could buy {laptops} laptops with that!', enabled: true },
        { category: 'technology', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'Enough for {cloudStorageMonths} months of cloud storage!', enabled: true },
        { category: 'travel', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'You could travel {miles} miles with this paycheck!', enabled: true },
        { category: 'travel', minAmount: '0.00', maxAmount: '100000.00', factTemplate: 'This could pay for {bnbNights} nights in an Airbnb!', enabled: true }
      ];

      await db.insert(paycheckFunFacts).values(templates);

      res.json({ 
        message: 'Successfully seeded fun fact templates', 
        count: templates.length,
        seeded: true 
      });
    } catch (error: any) {
      console.error('Error seeding fun facts:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Performance Review Cycle routes
  app.get('/api/performance/review-cycles', async (req, res) => {
    try {
      const cycles = await storage.getActiveReviewCycles();
      res.json(cycles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/performance/review-cycles/:id', async (req, res) => {
    try {
      const cycle = await storage.getReviewCycleById(req.params.id);
      if (!cycle) {
        return res.status(404).json({ error: 'Review cycle not found' });
      }
      res.json(cycle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/performance/review-cycles', async (req, res) => {
    try {
      const validated = insertReviewCycleSchema.parse(req.body);
      const cycle = await storage.createReviewCycle(validated);
      res.status(201).json(cycle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/performance/review-cycles/:id', async (req, res) => {
    try {
      const cycle = await storage.updateReviewCycle(req.params.id, req.body);
      if (!cycle) {
        return res.status(404).json({ error: 'Review cycle not found' });
      }
      res.json(cycle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Performance Reviews
  app.get('/api/performance/reviews', async (req, res) => {
    try {
      const cycleId = req.query.cycleId as string | undefined;
      const reviews = await storage.getPerformanceReviews(cycleId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/performance/reviews/:id', async (req, res) => {
    try {
      const review = await storage.getPerformanceReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Performance review not found' });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Notification routes
  app.get('/api/user-notifications', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      const notifications = await storage.getUserNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user-notifications', async (req, res) => {
    try {
      const validated = insertUserNotificationSchema.parse(req.body);
      const notification = await storage.createUserNotification(validated);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/user-notifications/:id/read', async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/user-notifications/read-all', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Collaborator Invitation routes
  app.get('/api/collaborator-invitations', async (req, res) => {
    try {
      const filters = {
        senderId: req.query.senderId as string | undefined,
        recipientId: req.query.recipientId as string | undefined,
        status: req.query.status as string | undefined
      };
      
      const invitations = await storage.getCollaboratorInvitations(filters);
      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/collaborator-invitations/:id', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      res.json(invitation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations', async (req, res) => {
    try {
      const validated = insertCollaboratorInvitationSchema.parse(req.body);
      const invitation = await storage.createCollaboratorInvitation(validated);
      
      await storage.createUserNotification({
        userId: validated.recipientId,
        type: 'collaborator_invite',
        title: 'New Collaboration Invite',
        message: `You have received a collaboration invite`,
        triggeredBy: validated.senderId,
        relatedId: invitation.id,
        isRead: false
      });
      
      const [sender, recipient] = await Promise.all([
        storage.getProfileById(validated.senderId),
        storage.getProfileById(validated.recipientId)
      ]);
      
      if (sender && recipient) {
        const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;
        const recipientName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email;
        
        await sendCollaboratorInviteEmail({
          recipientEmail: validated.recipientEmail,
          recipientName,
          senderName,
          message: validated.message || undefined,
          invitationId: invitation.id
        });
      }
      
      res.status(201).json(invitation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations/:id/accept', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(409).json({ 
          error: 'Invitation cannot be accepted',
          reason: `Current status is "${invitation.status}". Only pending invitations can be accepted.`
        });
      }
      
      const updated = await storage.updateCollaboratorInvitation(req.params.id, {
        status: 'accepted',
        respondedAt: new Date()
      });
      
      if (!updated) {
        return res.status(500).json({ error: 'Failed to update invitation' });
      }
      
      await storage.createUserNotification({
        userId: invitation.senderId,
        type: 'collaborator_accepted',
        title: 'Collaboration Invite Accepted',
        message: `Your collaboration invite has been accepted`,
        triggeredBy: invitation.recipientId,
        relatedId: invitation.id,
        isRead: false
      });
      
      const [sender, recipient] = await Promise.all([
        storage.getProfileById(invitation.senderId),
        storage.getProfileById(invitation.recipientId)
      ]);
      
      if (sender && recipient) {
        const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;
        const recipientName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email;
        
        await sendCollaboratorAcceptedEmail({
          recipientEmail: sender.email,
          recipientName: senderName,
          acceptedByName: recipientName
        });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/collaborator-invitations/:id/decline', async (req, res) => {
    try {
      const invitation = await storage.getCollaboratorInvitationById(req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(409).json({ 
          error: 'Invitation cannot be declined',
          reason: `Current status is "${invitation.status}". Only pending invitations can be declined.`
        });
      }
      
      const updated = await storage.updateCollaboratorInvitation(req.params.id, {
        status: 'declined',
        respondedAt: new Date()
      });
      
      if (!updated) {
        return res.status(500).json({ error: 'Failed to update invitation' });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId parameter is required' });
      }

      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard widget customization endpoints
  app.get('/api/dashboard/widgets/seed', async (req, res) => {
    try {
      const { seedDashboardWidgetPresets } = await import('./seed-dashboard-widgets.js');
      const result = await seedDashboardWidgetPresets();
      
      if (result.seeded) {
        return res.json({
          message: 'Successfully seeded dashboard widget presets from registry',
          count: result.count,
          seeded: true
        });
      } else {
        return res.json({
          message: 'Dashboard widget presets already exist',
          count: result.count,
          skipped: true
        });
      }
    } catch (error: any) {
      console.error('Error seeding dashboard widgets:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/dashboard/widgets', async (req, res) => {
    try {
      const { userId, role } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId parameter is required' });
      }
      
      if (!role || typeof role !== 'string') {
        return res.status(400).json({ error: 'role parameter is required' });
      }

      // Import the widget registry
      const { DASHBOARD_WIDGETS } = await import('../src/config/dashboardWidgets.js');
      
      // Fetch database presets and user preferences
      const [presets, userPrefs] = await Promise.all([
        storage.getDashboardWidgetPresets(),
        storage.getUserDashboardPreferences(userId)
      ]);

      // Create lookup maps for efficient merging
      const presetsMap = new Map(presets.map(p => [p.widgetId, p]));
      const userPrefsMap = new Map(userPrefs.map(u => [u.widgetId, u]));

      // Merge widgets with priority: user prefs → presets → registry defaults
      const mergedWidgets = DASHBOARD_WIDGETS
        .filter(widget => {
          // First: Check if widget is active in registry
          if (!widget.isActive) return false;
          
          // Second: Check if preset exists and is inactive in database
          const preset = presetsMap.get(widget.widgetId);
          if (preset && !preset.isActive) {
            return false; // Database preset deactivated this widget
          }
          
          // Third: Check if widget is visible for this role
          return widget.defaultVisibleForRoles.includes(role as any);
        })
        .map(widget => {
          const preset = presetsMap.get(widget.widgetId);
          const userPref = userPrefsMap.get(widget.widgetId);

          // Determine visibility and display order based on priority
          let isVisible = true;
          let displayOrder = widget.defaultDisplayOrder;

          // User preference has highest priority
          if (userPref) {
            isVisible = userPref.isVisible;
            displayOrder = userPref.displayOrder;
          }
          // Preset overrides registry default (if exists)
          else if (preset) {
            // Preset is visible if role is in defaultVisibleForRoles
            isVisible = preset.defaultVisibleForRoles?.includes(role) ?? true;
            displayOrder = preset.defaultDisplayOrder;
          }

          return {
            widgetId: widget.widgetId,
            widgetName: widget.widgetName,
            widgetDescription: widget.widgetDescription,
            category: widget.category,
            isVisible,
            displayOrder
          };
        })
        // Only return visible widgets, sorted by display order
        .filter(w => w.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.widgetId.localeCompare(b.widgetId));

      res.json({ widgets: mergedWidgets });
    } catch (error: any) {
      console.error('Error fetching dashboard widgets:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Announcements endpoints
  app.get('/api/announcements', async (req, res) => {
    try {
      let limit = 10; // Default
      if (req.query.limit) {
        const parsed = parseInt(req.query.limit as string);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
          return res.status(400).json({ error: 'Invalid limit parameter. Must be a number between 1 and 100.' });
        }
        limit = parsed;
      }
      const announcements = await storage.getPublishedAnnouncements(limit);
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can create announcements' });
      }

      // Validate request body
      const announcementData = {
        ...req.body,
        creatorUserId: userId // Use authenticated user ID, not client-provided
      };

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/announcements/:id', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can edit announcements' });
      }

      const { id } = req.params;
      const announcement = await storage.updateAnnouncement(id, req.body);
      
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check authorization
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Only HR department and Product Owners can delete announcements' });
      }

      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/announcements/:id/read', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      await storage.markAnnouncementAsRead(id, userId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User permissions endpoint
  app.get('/api/profiles/:id/permissions', async (req, res) => {
    try {
      const { id } = req.params;
      const permissions = await storage.getUserPermissions(id);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New hires endpoints
  app.get('/api/new-hires', async (_req, res) => {
    try {
      const newHires = await storage.getNewHires();
      res.json(newHires);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/new-hires/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const newHire = await storage.getNewHireById(id);
      if (!newHire) {
        return res.status(404).json({ error: 'New hire not found' });
      }
      res.json(newHire);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/new-hires', async (req, res) => {
    try {
      const { insertNewHireSchema } = await import('../shared/schema.js');
      
      // Validate request body
      const validatedData = insertNewHireSchema.parse(req.body);
      
      // Check if email already exists
      const existingHire = await storage.getNewHireByEmail(validatedData.email);
      if (existingHire) {
        return res.status(409).json({ error: 'A new hire with this email already exists' });
      }
      
      // Create new hire
      const newHire = await storage.createNewHire(validatedData);
      res.status(201).json(newHire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/new-hires/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { insertNewHireSchema } = await import('../shared/schema.js');
      
      // Validate request body (partial update)
      const validatedData = insertNewHireSchema.partial().parse(req.body);
      
      // Update new hire
      const updatedHire = await storage.updateNewHire(id, validatedData);
      if (!updatedHire) {
        return res.status(404).json({ error: 'New hire not found' });
      }
      res.json(updatedHire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  const validateTimeRange = (timeRange: string | undefined): string => {
    const validRanges = ['1m', '3m', '6m', '1y'];
    // If no time range provided (undefined/null), use default
    if (timeRange === undefined || timeRange === null) {
      return '3m';
    }
    // If time range provided (including empty string) but invalid, throw error
    if (!validRanges.includes(timeRange)) {
      throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
    }
    return timeRange;
  };

  app.get('/api/analytics/workforce', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getWorkforceMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/performance', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getPerformanceMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/leave', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getLeaveMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/financial', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const metrics = await storage.getFinancialMetrics(timeRange);
      res.json(metrics);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/analytics/summary', async (req, res) => {
    try {
      const timeRange = validateTimeRange(req.query.timeRange as string | undefined);
      const summary = await storage.getAnalyticsSummary(timeRange);
      res.json(summary);
    } catch (error: any) {
      if (error.message.includes('Invalid timeRange')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Admin cleanup endpoint - Deletes all demo data
  app.post('/api/admin/cleanup', async (req, res) => {
    try {
      // Security: Check for admin secret key
      const providedSecret = req.body.secret || req.query.secret;
      const adminSecret = process.env.ADMIN_SEED_SECRET;

      if (!adminSecret) {
        return res.status(500).json({ 
          error: 'Admin cleanup not configured. Set ADMIN_SEED_SECRET environment variable.' 
        });
      }

      if (providedSecret !== adminSecret) {
        console.warn('⚠️  Unauthorized cleanup attempt with invalid secret');
        return res.status(401).json({ 
          error: 'Unauthorized. Invalid admin secret key.' 
        });
      }

      // Delete data in correct order (respecting foreign key constraints)
      console.log('🔐 Admin cleanup endpoint called with valid credentials');
      console.log('🧹 Starting database cleanup...');
      
      const { db } = await import('./db.js');
      const { 
        reviewResponses, reviewGoalsComments, performanceReviews,
        reviewQuestionAssignments, reviewQuestionsLibrary, reviewQuestionTemplates, reviewCycles,
        leaveRequests, leaveBalances, newHires, candidates, employees,
        announcements, jobTitles, departments, profiles
      } = await import('../shared/schema.js');

      // Delete in reverse dependency order
      await db.delete(reviewResponses);
      console.log('   ✓ Deleted review responses');
      
      await db.delete(reviewGoalsComments);
      console.log('   ✓ Deleted review goals/comments');
      
      await db.delete(performanceReviews);
      console.log('   ✓ Deleted performance reviews');
      
      await db.delete(reviewQuestionAssignments);
      console.log('   ✓ Deleted review question assignments');
      
      await db.delete(reviewQuestionsLibrary);
      console.log('   ✓ Deleted review questions');
      
      await db.delete(reviewQuestionTemplates);
      console.log('   ✓ Deleted review templates');
      
      await db.delete(reviewCycles);
      console.log('   ✓ Deleted review cycles');
      
      await db.delete(leaveRequests);
      console.log('   ✓ Deleted leave requests');
      
      await db.delete(leaveBalances);
      console.log('   ✓ Deleted leave balances');
      
      await db.delete(newHires);
      console.log('   ✓ Deleted new hires');
      
      await db.delete(candidates);
      console.log('   ✓ Deleted candidates');
      
      await db.delete(employees);
      console.log('   ✓ Deleted employees');
      
      await db.delete(announcements);
      console.log('   ✓ Deleted announcements');
      
      await db.delete(jobTitles);
      console.log('   ✓ Deleted job titles');
      
      await db.delete(departments);
      console.log('   ✓ Deleted departments');
      
      await db.delete(profiles);
      console.log('   ✓ Deleted profiles');

      console.log('✅ Database cleanup completed successfully!');
      
      res.json({
        success: true,
        message: 'All demo data has been deleted successfully',
        tablesCleared: [
          'review_responses', 'review_goals_comments', 'performance_reviews',
          'review_question_assignments', 'review_questions_library', 'review_question_templates', 'review_cycles',
          'leave_requests', 'leave_balances', 'new_hires', 'candidates', 'employees',
          'announcements', 'job_titles', 'departments', 'profiles'
        ]
      });
    } catch (error: any) {
      console.error('❌ Admin cleanup endpoint error:', error);
      res.status(500).json({ 
        error: 'Cleanup failed', 
        details: error.message 
      });
    }
  });

  // Admin seed endpoint - Protected with secret key
  app.post('/api/admin/seed', async (req, res) => {
    try {
      // Security: Check for admin secret key
      const providedSecret = req.body.secret || req.query.secret;
      const adminSecret = process.env.ADMIN_SEED_SECRET;

      if (!adminSecret) {
        return res.status(500).json({ 
          error: 'Admin seeding not configured. Set ADMIN_SEED_SECRET environment variable.' 
        });
      }

      if (providedSecret !== adminSecret) {
        console.warn('⚠️  Unauthorized seed attempt with invalid secret');
        return res.status(401).json({ 
          error: 'Unauthorized. Invalid admin secret key.' 
        });
      }

      // Run the seed function
      console.log('🔐 Admin seed endpoint called with valid credentials');
      const result = await seedProductionDatabase();
      
      res.json(result);
    } catch (error: any) {
      console.error('❌ Admin seed endpoint error:', error);
      res.status(500).json({ 
        error: 'Seeding failed', 
        details: error.message 
      });
    }
  });

  // ====================================================================
  // AI AGENT ENDPOINTS - Autonomous AI capabilities
  // ====================================================================

  // Chat with Studio AI (real GPT-4, not canned responses)
  app.post('/api/ai-agent/chat', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { message, conversationHistory } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get user context
      const profile = await storage.getProfileById(userId);
      
      const response = await chatWithStudioAI(message, {
        userRole: profile?.role || undefined,
        department: profile?.department || undefined,
        conversationHistory: conversationHistory || []
      });

      res.json({ response });
    } catch (error: any) {
      console.error('[AI Agent] Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat request', details: error.message });
    }
  });

  // Screen a single candidate (autonomous screening)
  app.post('/api/ai-agent/screen-candidate/:applicationId', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { applicationId } = req.params;
      
      // Get application with related data
      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const candidate = await storage.getCandidateById(application.candidateId);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const jobPosting = await storage.getJobPostingById(application.jobPostingId);
      if (!jobPosting) {
        return res.status(404).json({ error: 'Job posting not found' });
      }

      const resumeData = application.resumeDataId 
        ? await storage.getResumeDataById(application.resumeDataId)
        : null;

      // Run autonomous AI screening
      const screening = await screenCandidate(candidate, application, resumeData, jobPosting);

      // Store screening results (you can extend storage to save these)
      console.log(`[AI Agent] Screened candidate ${candidate.name}:`, screening);

      res.json({
        success: true,
        screening
      });
    } catch (error: any) {
      console.error('[AI Agent] Screening error:', error);
      res.status(500).json({ error: 'Failed to screen candidate', details: error.message });
    }
  });

  // Batch screen all applications for a job (autonomous bulk screening)
  app.post('/api/ai-agent/screen-job/:jobId', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { jobId } = req.params;
      
      // Get all applications for this job
      const applications = await storage.getApplicationsByJob(jobId);
      
      if (applications.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No applications to screen',
          screenings: []
        });
      }

      // Prepare data for batch screening
      const batchData = await Promise.all(
        applications.map(async (app: any) => {
          const candidate = await storage.getCandidateById(app.candidateId);
          const jobPosting = await storage.getJobPostingById(app.jobPostingId);
          const resumeData = app.resumeDataId 
            ? await storage.getResumeDataById(app.resumeDataId)
            : null;

          return { candidate, application: app, resumeData, jobPosting };
        })
      );

      // Run autonomous batch screening
      const screenings = await batchScreenCandidates(batchData.filter((d: any) => d.candidate && d.jobPosting));

      console.log(`[AI Agent] Batch screened ${screenings.length} candidates for job ${jobId}`);

      res.json({
        success: true,
        screenings,
        summary: {
          total: screenings.length,
          strongYes: screenings.filter(s => s.recommendation === 'strong_yes').length,
          yes: screenings.filter(s => s.recommendation === 'yes').length,
          maybe: screenings.filter(s => s.recommendation === 'maybe').length,
          no: screenings.filter(s => s.recommendation === 'no').length,
          averageScore: screenings.reduce((sum, s) => sum + s.score, 0) / screenings.length
        }
      });
    } catch (error: any) {
      console.error('[AI Agent] Batch screening error:', error);
      res.status(500).json({ error: 'Failed to screen applications', details: error.message });
    }
  });

  // Generate hiring insights for a job (autonomous analytics)
  app.get('/api/ai-agent/insights/:jobId', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { jobId } = req.params;
      
      const applications = await storage.getApplicationsByJob(jobId);
      
      const insights = await generateHiringInsights(jobId, applications);

      res.json({
        success: true,
        insights
      });
    } catch (error: any) {
      console.error('[AI Agent] Insights error:', error);
      res.status(500).json({ error: 'Failed to generate insights', details: error.message });
    }
  });

  // Trigger autonomous daily screening workflow (manual trigger for testing)
  app.post('/api/ai-agent/run-daily-screening', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user has permission (HR only)
      const profile = await storage.getProfileById(userId);
      if (profile?.department !== 'HR' && profile?.role !== 'Product Owner') {
        return res.status(403).json({ error: 'Only HR can trigger autonomous workflows' });
      }

      console.log(`[AI Agent] Manual trigger of daily screening workflow by ${userId}`);
      
      const result = await runDailyScreeningWorkflow(storage);

      res.json({
        success: true,
        result,
        message: `Processed ${result.processed} applications, found ${result.topCandidates.length} top candidates`
      });
    } catch (error: any) {
      console.error('[AI Agent] Daily screening workflow error:', error);
      res.status(500).json({ error: 'Workflow failed', details: error.message });
    }
  });

  // Get AI agent status and capabilities
  app.get('/api/ai-agent/status', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      status: 'active',
      capabilities: [
        'Screen candidates automatically',
        'Rank applications by quality',
        'Generate hiring insights',
        'Answer HR questions in real-time',
        'Run scheduled workflows',
        'Send smart notifications'
      ],
      model: 'GPT-4o (via Replit AI Integrations)',
      version: '1.0.0-autonomous'
    });
  });

  /**
   * PAYROLL AI ASSISTANT ENDPOINTS
   * AI-powered payroll validation, expense analysis, and chat
   */

  // Validate payroll run for errors and compliance
  app.post('/api/ai-payroll/validate', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user has payroll permissions (HR or Product Owner)
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR and Product Owners can access payroll AI features' });
      }

      const { employees, payrollPeriod} = req.body;
      
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ error: 'Employees array is required' });
      }

      if (!payrollPeriod) {
        return res.status(400).json({ error: 'Payroll period is required' });
      }

      console.log(`[AI Payroll] Validating payroll for ${employees.length} employees`);
      
      const validation = await validatePayrollRun(employees, payrollPeriod);

      res.json({
        success: true,
        validation
      });
    } catch (error: any) {
      console.error('[AI Payroll] Validation error:', error);
      res.status(500).json({ error: 'Failed to validate payroll', details: error.message });
    }
  });

  // Analyze expenses for compliance and budget issues
  app.post('/api/ai-payroll/analyze-expenses', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user has payroll permissions
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR and Product Owners can access payroll AI features' });
      }

      const { expenses, budgetLimits } = req.body;
      
      if (!expenses || !Array.isArray(expenses)) {
        return res.status(400).json({ error: 'Expenses array is required' });
      }

      console.log(`[AI Payroll] Analyzing ${expenses.length} expense reports`);
      
      const analysis = await analyzeExpenses(expenses, budgetLimits);

      res.json({
        success: true,
        analysis
      });
    } catch (error: any) {
      console.error('[AI Payroll] Expense analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze expenses', details: error.message });
    }
  });

  // Chat with Payroll AI Assistant
  app.post('/api/ai-payroll/chat', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user has payroll permissions (HR or Product Owner)
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR and Product Owners can access payroll AI features' });
      }

      const { message, conversationHistory, payrollPeriod, employeeCount } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log(`[AI Payroll] Chat request from user ${userId}`);
      
      const response = await chatWithPayrollAI(message, {
        payrollPeriod,
        employeeCount,
        conversationHistory: conversationHistory || []
      });

      res.json({ response });
    } catch (error: any) {
      console.error('[AI Payroll] Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat request', details: error.message });
    }
  });

  // Generate auto-fix suggestions from validation results
  app.post('/api/ai-payroll/auto-fix-suggestions', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR can generate auto-fix suggestions' });
      }

      const { validation, employees } = req.body;
      
      if (!validation || !employees) {
        return res.status(400).json({ error: 'Validation results and employees are required' });
      }

      // Generate auto-fix suggestions based on critical issues using real tax calculations
      const autoFixSuggestions = await Promise.all(
        validation.criticalIssues
          .filter((issue: any) => issue.suggestion && issue.employeeId)
          .map(async (issue: any, index: number) => {
            const employee = employees.find((e: any) => e.id === issue.employeeId);
            if (!employee) return null;

            // Get employee profile for location data
            const profile = await storage.getProfileById(employee.id);
            if (!profile) return null;

            // Calculate correct taxes using real tax calculator
            const taxBreakdown = await taxCalculator.calculateTaxes({
              employeeId: employee.id,
              grossPay: employee.grossPay,
              workLocationState: profile.state,
              workLocationCity: profile.city,
              residenceState: profile.state, // Assume same unless configured otherwise
              residenceCity: profile.city
            });

            const correctedTotalTax = taxBreakdown.totalTax;
            const correctedNetPay = employee.grossPay - correctedTotalTax;

            return {
              id: `autofix-${Date.now()}-${index}`,
              title: `Fix: ${issue.issue}`,
              type: 'tax_calculation',
              severity: 'high',
              affectedEmployees: [{
                id: employee.id,
                name: employee.name,
                department: employee.department || 'N/A'
              }],
              beforeState: {
                grossPay: employee.grossPay,
                taxes: employee.taxes,
                netPay: employee.netPay,
                breakdown: 'Incorrect calculation'
              },
              afterState: {
                grossPay: employee.grossPay,
                taxes: correctedTotalTax,
                netPay: correctedNetPay,
                breakdown: {
                  federalIncomeTax: taxBreakdown.federalIncomeTax,
                  stateIncomeTax: taxBreakdown.stateIncomeTax,
                  localIncomeTax: taxBreakdown.localIncomeTax,
                  socialSecurity: taxBreakdown.socialSecurity,
                  medicare: taxBreakdown.medicare,
                  additionalMedicare: taxBreakdown.additionalMedicare
                }
              },
              explanation: issue.issue,
              recommendation: issue.suggestion,
              taxExplanation: taxBreakdown.taxExplanation,
              reciprocalAgreement: taxBreakdown.reciprocalAgreementApplied,
              impact: [
                `Employee: ${employee.name}`,
                `Location: ${profile.city}, ${profile.state}`,
                `Gross Pay: $${employee.grossPay.toLocaleString()}`,
                `Incorrect Tax: $${employee.taxes?.toLocaleString() || '0.00'}`,
                `Corrected Tax: $${correctedTotalTax.toLocaleString()}`,
                `Tax Difference: ${correctedTotalTax > (employee.taxes || 0) ? '+' : ''}$${(correctedTotalTax - (employee.taxes || 0)).toFixed(2)}`
              ]
            };
          })
      );

      // Filter out null results
      const validSuggestions = autoFixSuggestions.filter(Boolean);

      res.json({
        success: true,
        suggestions: validSuggestions
      });
    } catch (error: any) {
      console.error('[AI Payroll] Auto-fix generation error:', error);
      res.status(500).json({ error: 'Failed to generate auto-fix suggestions', details: error.message });
    }
  });

  // Apply approved auto-fix
  app.post('/api/auto-fix/approve', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR can approve auto-fixes' });
      }

      const { fixId, fixData, reason, employeePayrollData } = req.body;
      
      if (!fixId || !fixData) {
        return res.status(400).json({ error: 'Fix ID and data are required' });
      }

      const approver = await storage.getProfileById(userId);
      if (!approver) {
        return res.status(404).json({ error: 'Approver profile not found' });
      }

      const affectedEmployeeIds = fixData.affectedEmployees.map((e: any) => e.id);
      
      // SECURITY FIX: Validate all affected employees have approved timesheets for the SAME pay period
      // This prevents manipulation by ensuring a consistent, server-verified pay period
      
      // Step 1: Load approved timesheets for all affected employees
      const employeeTimesheets = await Promise.all(
        affectedEmployeeIds.map(async (empId: string) => {
          const timesheets = await db.select()
            .from(timesheetEntries)
            .where(and(
              eq(timesheetEntries.employeeId, empId),
              or(
                eq(timesheetEntries.status, 'Approved'),
                eq(timesheetEntries.status, 'Locked')
              )
            ))
            .orderBy(desc(timesheetEntries.createdAt))
            .limit(1);
          
          return timesheets.length > 0 ? { employeeId: empId, timesheet: timesheets[0] } : null;
        })
      );

      const validTimesheets = employeeTimesheets.filter(Boolean);
      
      if (validTimesheets.length === 0) {
        return res.status(400).json({ 
          error: 'No approved timesheets found',
          details: 'All affected employees must have approved timesheets before auto-fix can be applied'
        });
      }

      if (validTimesheets.length !== affectedEmployeeIds.length) {
        const missingTimesheets = affectedEmployeeIds.filter(id => 
          !validTimesheets.some(t => t?.employeeId === id)
        );
        return res.status(400).json({ 
          error: 'Missing approved timesheets',
          details: `${missingTimesheets.length} employee(s) do not have approved timesheets`,
          missingEmployeeIds: missingTimesheets
        });
      }

      // Step 2: Validate ALL timesheets are for the SAME pay period (prevent manipulation)
      const payPeriods = new Set(validTimesheets.map(t => 
        t ? `${t.timesheet.payPeriodStart}|${t.timesheet.payPeriodEnd}` : ''
      ));
      
      if (payPeriods.size > 1) {
        return res.status(400).json({ 
          error: 'Inconsistent pay periods',
          details: 'All affected employees must have timesheets for the same pay period. Found multiple pay periods.',
          payPeriods: Array.from(payPeriods)
        });
      }

      // Step 3: Use the validated, consistent pay period from database
      const firstTimesheet = validTimesheets[0]!.timesheet;
      const payPeriodStart = firstTimesheet.payPeriodStart;
      const payPeriodEnd = firstTimesheet.payPeriodEnd;
      
      console.log(`[Auto-Fix] Validated consistent pay period across ${validTimesheets.length} employees: ${payPeriodStart} to ${payPeriodEnd}`);

      // For each affected employee, recalculate EVERYTHING from authoritative database records (don't trust client data)
      const recalculatedStates = await Promise.all(
        affectedEmployeeIds.map(async (empId: string) => {
          const profile = await storage.getProfileById(empId);
          const employee = await storage.getEmployeeById(empId);
          if (!profile || !employee) return null;

          // Load approved timesheet from database (SECURITY: Don't trust client hours)
          const approvedTimesheet = await storage.getTimesheetEntryByEmployeeAndPeriod(
            empId,
            payPeriodStart,
            payPeriodEnd
          );

          if (!approvedTimesheet) {
            console.warn(`No approved timesheet found for employee ${empId} in period ${payPeriodStart} to ${payPeriodEnd}`);
            return null; // Skip employees without approved timesheets
          }

          if (approvedTimesheet.status !== 'Approved' && approvedTimesheet.status !== 'Locked') {
            console.warn(`Timesheet for employee ${empId} is not approved (status: ${approvedTimesheet.status})`);
            return null; // Skip employees with unapproved timesheets
          }
          
          // Recalculate gross pay from authoritative employee record + approved timesheet hours
          let authoritativeGrossPay: number;
          if (employee.employeeType === 'Hourly') {
            const regularHours = parseFloat(approvedTimesheet.regularHours);
            const overtimeHours = parseFloat(approvedTimesheet.overtimeHours);
            const hourlyRate = parseFloat(employee.hourlyRate || '0');
            const overtimeRate = hourlyRate * 1.5;
            authoritativeGrossPay = (regularHours * hourlyRate) + (overtimeHours * overtimeRate);
          } else {
            // Salaried - assume bi-weekly pay periods (26 per year)
            authoritativeGrossPay = parseFloat(employee.salary || '0') / 26;
          }

          // Recalculate taxes using real tax calculator with authoritative gross pay
          const taxBreakdown = await taxCalculator.calculateTaxes({
            employeeId: empId,
            grossPay: authoritativeGrossPay,
            workLocationState: profile.state,
            workLocationCity: profile.city,
            residenceState: profile.state,
            residenceCity: profile.city
          });

          return {
            employeeId: empId,
            employeeName: profile.name,
            authoritativeGrossPay,
            beforeTax: fixData.beforeState.taxes,
            afterTax: taxBreakdown.totalTax,
            netPay: authoritativeGrossPay - taxBreakdown.totalTax,
            breakdown: taxBreakdown
          };
        })
      );

      const validRecalculated = recalculatedStates.filter(Boolean);
      if (validRecalculated.length === 0) {
        return res.status(400).json({ error: 'No valid employees found for fix' });
      }

      // Create audit log entry for EACH affected employee (not just the first one)
      for (const recalc of validRecalculated) {
        const actualAfterState = {
          grossPay: recalc.authoritativeGrossPay,
          taxes: recalc.afterTax,
          netPay: recalc.netPay,
          breakdown: recalc.breakdown
        };

        await storage.createAutoFixAuditLog({
          fixType: fixData.type,
          fixTitle: fixData.title,
          affectedEmployeeIds: [recalc.employeeId], // One employee per audit log entry
          beforeState: JSON.stringify(fixData.beforeState),
          afterState: JSON.stringify(actualAfterState), // Use recalculated, not client data
          approverId: userId,
          approverName: approver.name,
          approvalReason: reason || 'Auto-fix approved',
          status: 'approved'
        });
      }

      // Build recipients list for comprehensive notification service
      const recipients: any[] = [];

      for (const empId of affectedEmployeeIds) {
        const employee = await storage.getProfileById(empId);
        if (!employee) continue;

        // Add employee as recipient
        recipients.push({
          userId: empId,
          email: employee.email,
          name: employee.name,
          role: 'employee'
        });

        // Add manager as recipient
        if (employee.managerId) {
          const manager = await storage.getProfileById(employee.managerId);
          if (manager && !recipients.find(r => r.userId === manager.id)) {
            recipients.push({
              userId: manager.id,
              email: manager.email,
              name: manager.name,
              role: 'manager'
            });
          }
        }
      }

      // Add HR and Payroll team members
      const allProfiles = await storage.getAllProfiles();
      const hrAndPayroll = allProfiles.filter(p => 
        (p.department === 'HR' || p.department === 'Payroll' || p.role === 'Product Owner') &&
        p.id !== userId // Exclude approver
      );

      for (const teamMember of hrAndPayroll) {
        if (!recipients.find(r => r.userId === teamMember.id)) {
          recipients.push({
            userId: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            role: teamMember.department === 'HR' ? 'hr' : 'payroll'
          });
        }
      }

      // Generate changes summary from recalculated data
      const changesSummary = validRecalculated.length > 0
        ? `Tax calculation corrected: Before $${validRecalculated[0].beforeTax?.toLocaleString() || '0.00'}, After $${validRecalculated[0].afterTax.toLocaleString()}`
        : fixData.title;

      // Send comprehensive notifications to all stakeholders using NotificationService
      const notificationResult = await notificationService.sendAutoFixApprovalNotifications(
        {
          fixType: fixData.type,
          fixTitle: fixData.title,
          affectedEmployees: fixData.affectedEmployees,
          approvedBy: userId,
          approvedByName: approver.name,
          approvalReason: reason,
          changesSummary
        },
        recipients
      );

      console.log(`✅ Auto-fix approved: ${notificationResult.emailsSent.length} emails sent, ${notificationResult.inAppNotificationsSent.length} in-app notifications created`);

      res.json({
        success: true,
        message: 'Auto-fix approved and notifications sent to all stakeholders',
        actualCorrections: validRecalculated.map(recalc => ({
          employeeId: recalc.employeeId,
          employeeName: recalc.employeeName,
          grossPay: recalc.authoritativeGrossPay,
          taxes: recalc.afterTax,
          netPay: recalc.netPay
        })), // Return actual recalculated values for ALL employees
        notificationsSent: {
          emails: notificationResult.emailsSent.length,
          inApp: notificationResult.inAppNotificationsSent.length
        }
      });
    } catch (error: any) {
      console.error('[Auto-Fix] Approval error:', error);
      res.status(500).json({ error: 'Failed to approve auto-fix', details: error.message });
    }
  });

  // Tutorial System API Endpoints

  // Get all tutorials filtered by user's role
  app.get('/api/tutorials', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get user's profile to determine role
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId)
      });

      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRole = userProfile.role || 'Employee';
      console.log(`[Tutorials] User role: ${userRole}`);

      // Fetch all published tutorials that the user has access to
      const allTutorials = await db.query.tutorials.findMany({
        where: eq(tutorials.isPublished, true),
        orderBy: [asc(tutorials.sortOrder), asc(tutorials.createdAt)]
      });
      console.log(`[Tutorials] Fetched ${allTutorials.length} published tutorials from database`);

      // Filter tutorials by role access
      const accessibleTutorials = allTutorials.filter(tutorial => {
        const hasAccess = tutorial.roleAccess.includes(userRole);
        console.log(`[Tutorials] Tutorial "${tutorial.title}" roleAccess: [${tutorial.roleAccess.join(', ')}], user has access: ${hasAccess}`);
        return hasAccess;
      });
      console.log(`[Tutorials] ${accessibleTutorials.length} tutorials accessible to role: ${userRole}`);

      // Get user's progress for these tutorials
      const tutorialIds = accessibleTutorials.map(t => t.id);
      const userProgress = await db.query.tutorialCompletions.findMany({
        where: and(
          eq(tutorialCompletions.userId, userId),
          inArray(tutorialCompletions.tutorialId, tutorialIds)
        )
      });

      // Merge tutorials with progress
      const tutorialsWithProgress = accessibleTutorials.map(tutorial => {
        const progress = userProgress.find(p => p.tutorialId === tutorial.id);
        return {
          ...tutorial,
          progress: progress || null
        };
      });

      res.json(tutorialsWithProgress);
    } catch (error: any) {
      console.error('[Tutorials] Error fetching tutorials:', error);
      res.status(500).json({ error: 'Failed to fetch tutorials', details: error.message });
    }
  });

  // Get a specific tutorial with all steps
  app.get('/api/tutorials/:id', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const tutorialId = req.params.id;

      // Get user's role
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId)
      });

      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRole = userProfile.role || 'Employee';

      // Fetch tutorial with steps
      const tutorial = await db.query.tutorials.findFirst({
        where: eq(tutorials.id, tutorialId)
      });

      if (!tutorial) {
        return res.status(404).json({ error: 'Tutorial not found' });
      }

      // Check if user has access to this tutorial
      if (!tutorial.roleAccess.includes(userRole)) {
        return res.status(403).json({ error: 'You do not have access to this tutorial' });
      }

      // Get tutorial steps
      const steps = await db.query.tutorialSteps.findMany({
        where: eq(tutorialSteps.tutorialId, tutorialId),
        orderBy: [asc(tutorialSteps.stepNumber)]
      });

      // Get user's progress
      const progress = await db.query.tutorialCompletions.findFirst({
        where: and(
          eq(tutorialCompletions.userId, userId),
          eq(tutorialCompletions.tutorialId, tutorialId)
        )
      });

      // Update last accessed time if progress exists
      if (progress) {
        await db.update(tutorialCompletions)
          .set({ lastAccessedAt: new Date() })
          .where(eq(tutorialCompletions.id, progress.id));
      }

      res.json({
        ...tutorial,
        steps,
        progress: progress || null
      });
    } catch (error: any) {
      console.error('[Tutorials] Error fetching tutorial:', error);
      res.status(500).json({ error: 'Failed to fetch tutorial', details: error.message });
    }
  });

  // Get user's progress for a tutorial
  app.get('/api/tutorials/:id/progress', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const tutorialId = req.params.id;

      const progress = await db.query.tutorialCompletions.findFirst({
        where: and(
          eq(tutorialCompletions.userId, userId),
          eq(tutorialCompletions.tutorialId, tutorialId)
        )
      });

      res.json(progress || null);
    } catch (error: any) {
      console.error('[Tutorials] Error fetching progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress', details: error.message });
    }
  });

  // Update user's progress on a tutorial
  app.post('/api/tutorials/:id/progress', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const tutorialId = req.params.id;
      const { currentStepNumber, completedSteps, isCompleted } = req.body;

      // Check if progress record exists
      const existingProgress = await db.query.tutorialCompletions.findFirst({
        where: and(
          eq(tutorialCompletions.userId, userId),
          eq(tutorialCompletions.tutorialId, tutorialId)
        )
      });

      if (existingProgress) {
        // Update existing progress
        const updateData: any = {
          lastAccessedAt: new Date()
        };

        if (currentStepNumber !== undefined) {
          updateData.currentStepNumber = currentStepNumber;
        }

        if (completedSteps !== undefined) {
          updateData.completedSteps = completedSteps;
        }

        if (isCompleted !== undefined) {
          updateData.isCompleted = isCompleted;
          if (isCompleted && !existingProgress.completedAt) {
            updateData.completedAt = new Date();
          }
        }

        await db.update(tutorialCompletions)
          .set(updateData)
          .where(eq(tutorialCompletions.id, existingProgress.id));

        const updatedProgress = await db.query.tutorialCompletions.findFirst({
          where: eq(tutorialCompletions.id, existingProgress.id)
        });

        res.json(updatedProgress);
      } else {
        // Create new progress record
        const newProgress = await db.insert(tutorialCompletions).values({
          userId,
          tutorialId,
          currentStepNumber: currentStepNumber || 1,
          completedSteps: completedSteps || [],
          isCompleted: isCompleted || false,
          completedAt: isCompleted ? new Date() : null
        }).returning();

        res.json(newProgress[0]);
      }
    } catch (error: any) {
      console.error('[Tutorials] Error updating progress:', error);
      res.status(500).json({ error: 'Failed to update progress', details: error.message });
    }
  });

  // Seed tutorials (admin only)
  app.post('/api/tutorials/seed', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user has admin permissions
      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only HR and Product Owners can seed tutorials' });
      }

      console.log('[Tutorials] Seeding database with initial tutorials...');

      // Check if tutorials already exist
      const existingTutorials = await db.query.tutorials.findMany();
      if (existingTutorials.length > 0) {
        return res.json({ 
          message: 'Tutorials already exist. Skipping seeding.',
          count: existingTutorials.length 
        });
      }

      // Tutorial 1: Getting Started
      const tutorial1 = await db.insert(tutorials).values({
        title: 'Getting Started with HRStudio360',
        description: 'Learn the basics of navigating HRStudio360, understanding your dashboard, and managing your profile.',
        category: 'getting-started',
        difficulty: 'beginner',
        estimatedMinutes: 10,
        roleAccess: ['Employee', 'Manager', 'HR', 'Product Owner'],
        tags: ['basics', 'onboarding', 'navigation'],
        sortOrder: 1
      }).returning();

      await db.insert(tutorialSteps).values([
        {
          tutorialId: tutorial1[0].id,
          stepNumber: 1,
          title: 'Welcome to HRStudio360!',
          content: '<p>HRStudio360 is your complete HR management platform. In this tutorial, you\'ll learn how to navigate the dashboard and customize your experience.</p><p><strong>What you\'ll learn:</strong></p><ul><li>Dashboard navigation</li><li>Accessing key modules</li><li>Personalizing your profile</li></ul>',
          checklist: ['Familiarize yourself with the main navigation', 'Identify the Dashboard widgets', 'Understand role-based access']
        },
        {
          tutorialId: tutorial1[0].id,
          stepNumber: 2,
          title: 'Understanding Your Dashboard',
          content: '<p>Your dashboard is personalized based on your role and provides quick access to important information.</p><p><strong>Dashboard Features:</strong></p><ul><li><strong>Widgets:</strong> Customizable cards showing key metrics</li><li><strong>Quick Actions:</strong> Fast access to common tasks</li><li><strong>Notifications:</strong> Stay updated on important events</li></ul>',
          checklist: ['Explore available widgets', 'Try clicking on different metrics', 'Check your notifications']
        },
        {
          tutorialId: tutorial1[0].id,
          stepNumber: 3,
          title: 'Navigating Modules',
          content: '<p>HRStudio360 organizes features into modules accessible from the sidebar and dashboard:</p><ul><li><strong>Payroll:</strong> Manage employee compensation</li><li><strong>Hiring:</strong> Track recruitment pipeline</li><li><strong>Training:</strong> Access learning resources</li><li><strong>People:</strong> View employee directory</li></ul>',
          actionType: 'open-modal',
          actionTarget: 'payroll',
          actionLabel: 'Open Payroll Module',
          checklist: ['Navigate to different modules', 'Notice how each module opens', 'Return to dashboard']
        },
        {
          tutorialId: tutorial1[0].id,
          stepNumber: 4,
          title: 'Updating Your Profile',
          content: '<p>Keep your profile information current to ensure accurate records and personalized experience.</p><p><strong>Profile sections:</strong></p><ul><li>Contact information</li><li>Emergency contacts</li><li>Preferences and settings</li></ul><p>Click "Try it now" to update your profile!</p>',
          actionType: 'navigate',
          actionTarget: '/profile',
          actionLabel: 'Go to Profile',
          checklist: ['Review your profile information', 'Update any outdated details', 'Save your changes']
        }
      ]);

      // Tutorial 2: Payroll Wizard
      const tutorial2 = await db.insert(tutorials).values({
        title: 'Running Your First Payroll with the Guided Wizard',
        description: 'Master the step-by-step payroll process using HRStudio360\'s AI-powered wizard for error-free processing.',
        category: 'payroll',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        roleAccess: ['HR', 'Product Owner'],
        tags: ['payroll', 'wizard', 'processing'],
        sortOrder: 2
      }).returning();

      await db.insert(tutorialSteps).values([
        {
          tutorialId: tutorial2[0].id,
          stepNumber: 1,
          title: 'Introduction to Payroll Processing',
          content: '<p>Processing payroll accurately is critical for employee satisfaction and legal compliance. HRStudio360\'s guided wizard walks you through each step to ensure accuracy.</p><p><strong>The payroll workflow:</strong></p><ol><li>Select payroll type</li><li>Review employee data</li><li>AI error detection</li><li>Submit for processing</li></ol>',
          checklist: ['Understand the payroll workflow', 'Know your payroll schedule', 'Have employee hours ready']
        },
        {
          tutorialId: tutorial2[0].id,
          stepNumber: 2,
          title: 'Launching the Payroll Wizard',
          content: '<p>The Payroll Wizard guides you through each step with contextual help and AI-powered validation.</p><p><strong>To start:</strong></p><ol><li>Open the Payroll module from your dashboard</li><li>Select your payroll type (Hourly, Salaried, or Both)</li><li>Click "Start Guided Payroll"</li></ol><p>The wizard will show you a 5-step process with progress tracking.</p>',
          actionType: 'open-modal',
          actionTarget: 'payroll',
          actionLabel: 'Open Payroll Module',
          checklist: ['Navigate to Payroll', 'Select payroll type', 'Click Start Guided Payroll']
        },
        {
          tutorialId: tutorial2[0].id,
          stepNumber: 3,
          title: 'Reviewing Timesheets and Hours',
          content: '<p>Step 1 of the wizard helps you verify employee hours and overtime.</p><p><strong>What to check:</strong></p><ul><li>Regular hours vs. overtime</li><li>Manager approvals</li><li>Time-off deductions</li><li>Unusual hour patterns</li></ul><p>The wizard highlights potential issues automatically.</p>',
          checklist: ['Review all employee timesheets', 'Verify overtime calculations', 'Check manager approvals', 'Address any warnings']
        },
        {
          tutorialId: tutorial2[0].id,
          stepNumber: 4,
          title: 'Processing Expenses and Leave Requests',
          content: '<p>Steps 2 & 3 guide you through expense claims and leave requests that affect payroll.</p><p><strong>Expenses:</strong> Review expense reports and ensure proper documentation</p><p><strong>Leave Requests:</strong> Process PTO, sick leave, and unpaid leave that impact pay</p><p>Studio AI helps identify compliance issues and missing documentation.</p>',
          checklist: ['Review pending expense claims', 'Process leave requests', 'Verify documentation', 'Ask Studio AI for help if needed']
        },
        {
          tutorialId: tutorial2[0].id,
          stepNumber: 5,
          title: 'Final Review and Submission',
          content: '<p>The final wizard step shows a comprehensive summary:</p><ul><li>Total gross pay</li><li>Tax withholdings</li><li>Deductions</li><li>Net pay by employee</li></ul><p><strong>Before submitting:</strong></p><ol><li>Review the payroll summary</li><li>Run Studio AI validation</li><li>Confirm all amounts</li><li>Submit for processing</li></ol><p>Congratulations! You\'ve completed your first guided payroll run.</p>',
          checklist: ['Review payroll summary', 'Verify all calculations', 'Use AI validation', 'Submit payroll']
        }
      ]);

      // Tutorial 3: Hiring Pipeline
      const tutorial3 = await db.insert(tutorials).values({
        title: 'Managing the Hiring Pipeline',
        description: 'Learn to post jobs, review candidates, and move them through your recruitment stages efficiently.',
        category: 'hiring',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        roleAccess: ['HR', 'Manager', 'Product Owner'],
        tags: ['hiring', 'recruitment', 'ats'],
        sortOrder: 3
      }).returning();

      await db.insert(tutorialSteps).values([
        {
          tutorialId: tutorial3[0].id,
          stepNumber: 1,
          title: 'Understanding the ATS',
          content: '<p>HRStudio360 includes a full Applicant Tracking System (ATS) to streamline your hiring process.</p><p><strong>Key features:</strong></p><ul><li>Job posting management</li><li>Candidate pipeline visualization</li><li>Interview scheduling</li><li>Collaborative hiring</li><li>AI-powered candidate screening</li></ul>',
          checklist: ['Understand ATS capabilities', 'Know your hiring stages', 'Identify stakeholders']
        },
        {
          tutorialId: tutorial3[0].id,
          stepNumber: 2,
          title: 'Creating a Job Posting',
          content: '<p>Start by creating a compelling job posting that attracts top talent.</p><p><strong>Best practices:</strong></p><ul><li>Clear, descriptive job title</li><li>Detailed responsibilities</li><li>Required qualifications</li><li>Salary range (recommended)</li><li>Company culture highlights</li></ul><p>Try creating a job posting now!</p>',
          actionType: 'open-modal',
          actionTarget: 'hiring',
          actionLabel: 'Open Hiring Module',
          checklist: ['Write clear job description', 'Set salary range', 'Define qualifications', 'Publish posting']
        },
        {
          tutorialId: tutorial3[0].id,
          stepNumber: 3,
          title: 'Reviewing Candidates',
          content: '<p>As applications come in, review candidates in the pipeline view.</p><p><strong>Candidate review workflow:</strong></p><ol><li>Click on a candidate card</li><li>Review resume and application</li><li>Check AI screening scores</li><li>Add notes and ratings</li><li>Move to next stage or reject</li></ol>',
          checklist: ['Open candidate profiles', 'Review applications', 'Add ratings', 'Update candidate status']
        },
        {
          tutorialId: tutorial3[0].id,
          stepNumber: 4,
          title: 'Managing Interview Stages',
          content: '<p>Move candidates through your hiring pipeline as they progress.</p><p><strong>Pipeline stages:</strong></p><ul><li><strong>Applied:</strong> Initial applications</li><li><strong>Screening:</strong> Phone/video screen</li><li><strong>Interview:</strong> In-person interviews</li><li><strong>Offer:</strong> Extended offers</li><li><strong>Hired:</strong> Accepted offers</li></ul><p>Drag and drop candidates between stages or use the context menu.</p>',
          checklist: ['Move candidates between stages', 'Schedule interviews', 'Send status updates', 'Track pipeline metrics']
        }
      ]);

      // Tutorial 4: Studio AI
      const tutorial4 = await db.insert(tutorials).values({
        title: 'Using Studio AI for Smart Recruitment',
        description: 'Harness AI-powered insights to screen candidates, generate hiring recommendations, and automate repetitive tasks.',
        category: 'ai-features',
        difficulty: 'advanced',
        estimatedMinutes: 25,
        roleAccess: ['HR', 'Product Owner'],
        tags: ['ai', 'automation', 'screening'],
        sortOrder: 4
      }).returning();

      await db.insert(tutorialSteps).values([
        {
          tutorialId: tutorial4[0].id,
          stepNumber: 1,
          title: 'Meet Studio AI: Your Intelligent Assistant',
          content: '<p>Studio AI is your AI-powered assistant that helps with recruitment and payroll tasks.</p><p><strong>AI capabilities:</strong></p><ul><li>Automated candidate screening</li><li>Resume analysis and scoring</li><li>Hiring insights and recommendations</li><li>Payroll validation and error detection</li><li>Natural language queries</li></ul><p>Access Studio AI via the purple "Ask Studio AI" buttons throughout the app.</p>',
          checklist: ['Locate Studio AI buttons', 'Understand AI capabilities', 'Know when to use AI assistance']
        },
        {
          tutorialId: tutorial4[0].id,
          stepNumber: 2,
          title: 'Automated Candidate Screening',
          content: '<p>Studio AI can automatically screen candidates against job requirements.</p><p><strong>How it works:</strong></p><ol><li>AI analyzes resume content</li><li>Matches skills to job requirements</li><li>Generates screening score (0-100)</li><li>Identifies strengths and gaps</li><li>Provides hiring recommendation</li></ol><p>Review AI scores alongside your own judgment for best results.</p>',
          actionType: 'open-modal',
          actionTarget: 'hiring',
          actionLabel: 'View Candidate Screening',
          checklist: ['Review AI screening scores', 'Read AI analysis', 'Compare with manual review', 'Make informed decisions']
        },
        {
          tutorialId: tutorial4[0].id,
          stepNumber: 3,
          title: 'Getting Hiring Insights',
          content: '<p>Ask Studio AI for strategic hiring insights and recommendations.</p><p><strong>Example queries:</strong></p><ul><li>"What are the top candidates for the Senior Developer role?"</li><li>"Compare the qualifications of candidates in the Interview stage"</li><li>"What skills are missing from our candidate pipeline?"</li></ul><p>Studio AI provides data-driven answers to help you make better hiring decisions.</p>',
          checklist: ['Open Studio AI chat', 'Ask strategic questions', 'Review AI insights', 'Apply recommendations']
        },
        {
          tutorialId: tutorial4[0].id,
          stepNumber: 4,
          title: 'Batch Processing with AI',
          content: '<p>Screen multiple candidates at once to save time.</p><p><strong>Batch screening:</strong></p><ol><li>Select multiple unscreened candidates</li><li>Click "Batch Screen with AI"</li><li>AI processes all candidates simultaneously</li><li>Review results and prioritize top matches</li></ol><p>This is especially useful when you have many applications to review quickly.</p>',
          checklist: ['Select multiple candidates', 'Run batch screening', 'Review AI results', 'Prioritize high scores']
        },
        {
          tutorialId: tutorial4[0].id,
          stepNumber: 5,
          title: 'AI-Powered Payroll Validation',
          content: '<p>Studio AI also assists with payroll processing by detecting errors and anomalies.</p><p><strong>Payroll AI features:</strong></p><ul><li>Automatic error detection</li><li>Expense compliance checking</li><li>Unusual pattern identification</li><li>Calculation verification</li></ul><p>Use AI validation before submitting payroll to catch mistakes early.</p>',
          checklist: ['Run AI payroll validation', 'Review detected issues', 'Fix errors', 'Confirm with AI again']
        }
      ]);

      const tutorialCount = 4;
      console.log(`[Tutorials] Successfully seeded ${tutorialCount} tutorials with steps`);

      // Seed tutorial badges
      console.log('[Badges] Seeding tutorial achievement badges...');
      const existingBadges = await db.query.tutorialBadges.findMany();
      
      if (existingBadges.length === 0) {
        await db.insert(tutorialBadges).values([
          {
            name: 'First Steps',
            description: 'Complete your first tutorial',
            iconName: 'BookOpen',
            iconColor: '#10b981',
            category: 'completion',
            requirement: 'Complete 1 tutorial',
            sortOrder: 1
          },
          {
            name: 'Tutorial Novice',
            description: 'Complete 3 tutorials',
            iconName: 'GraduationCap',
            iconColor: '#3b82f6',
            category: 'completion',
            requirement: 'Complete 3 tutorials',
            sortOrder: 2
          },
          {
            name: 'Tutorial Enthusiast',
            description: 'Complete 5 tutorials',
            iconName: 'Trophy',
            iconColor: '#f59e0b',
            category: 'completion',
            requirement: 'Complete 5 tutorials',
            sortOrder: 3
          },
          {
            name: 'Tutorial Expert',
            description: 'Complete 10 tutorials',
            iconName: 'Crown',
            iconColor: '#8b5cf6',
            category: 'mastery',
            requirement: 'Complete 10 tutorials',
            sortOrder: 4
          },
          {
            name: 'Payroll Master',
            description: 'Complete all payroll tutorials',
            iconName: 'DollarSign',
            iconColor: '#06b6d4',
            category: 'mastery',
            requirement: 'Complete all payroll tutorials',
            sortOrder: 5
          },
          {
            name: 'Hiring Guru',
            description: 'Complete all hiring tutorials',
            iconName: 'Users',
            iconColor: '#ec4899',
            category: 'mastery',
            requirement: 'Complete all hiring tutorials',
            sortOrder: 6
          },
          {
            name: 'AI Explorer',
            description: 'Complete the Studio AI tutorial',
            iconName: 'Sparkles',
            iconColor: '#a855f7',
            category: 'special',
            requirement: 'Complete the Studio AI tutorial',
            sortOrder: 7
          }
        ]);
        console.log('[Badges] Successfully seeded 7 achievement badges');
      } else {
        console.log(`[Badges] Badges already exist (${existingBadges.length}). Skipping seeding.`);
      }

      res.json({
        message: `Successfully seeded ${tutorialCount} tutorials with comprehensive step-by-step guides and achievement badges`,
        count: tutorialCount,
        badgesSeeded: existingBadges.length === 0 ? 7 : 0
      });
    } catch (error: any) {
      console.error('[Tutorials] Seed error:', error);
      res.status(500).json({ error: 'Failed to seed tutorials', details: error.message });
    }
  });

  // Generate certificate for completed tutorial
  app.post('/api/tutorials/:id/certificate', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const tutorialId = req.params.id;

      // Check if tutorial is completed
      const completion = await db.query.tutorialCompletions.findFirst({
        where: and(
          eq(tutorialCompletions.userId, userId),
          eq(tutorialCompletions.tutorialId, tutorialId),
          eq(tutorialCompletions.isCompleted, true)
        )
      });

      if (!completion) {
        return res.status(400).json({ error: 'Tutorial not completed yet' });
      }

      // Check if certificate already exists
      const existing = await db.query.tutorialCertificates.findFirst({
        where: and(
          eq(tutorialCertificates.userId, userId),
          eq(tutorialCertificates.tutorialId, tutorialId)
        )
      });

      if (existing) {
        return res.json(existing);
      }

      // Get tutorial and user info for certificate
      const tutorial = await db.query.tutorials.findFirst({
        where: eq(tutorials.id, tutorialId)
      });

      const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId)
      });

      if (!tutorial || !user) {
        return res.status(404).json({ error: 'Tutorial or user not found' });
      }

      // Generate unique certificate number
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const certificateNumber = `CERT-${year}-${randomNum}`;

      // Create certificate
      const [certificate] = await db.insert(tutorialCertificates).values({
        userId,
        tutorialId,
        certificateNumber,
        userName: `${user.firstName} ${user.lastName}`,
        tutorialTitle: tutorial.title
      }).returning();

      res.json(certificate);
    } catch (error: any) {
      console.error('[Certificates] Error generating certificate:', error);
      res.status(500).json({ error: 'Failed to generate certificate', details: error.message });
    }
  });

  // Get all available badges
  app.get('/api/tutorials/badges', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const badges = await db.query.tutorialBadges.findMany({
        where: eq(tutorialBadges.isActive, true),
        orderBy: (tutorialBadges, { asc }) => [asc(tutorialBadges.sortOrder)]
      });

      res.json(badges);
    } catch (error: any) {
      console.error('[Badges] Error fetching badges:', error);
      res.status(500).json({ error: 'Failed to fetch badges', details: error.message });
    }
  });

  // Get badges earned by current user
  app.get('/api/users/me/badges', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userBadges = await db.query.userTutorialBadges.findMany({
        where: eq(userTutorialBadges.userId, userId),
        orderBy: (userTutorialBadges, { desc }) => [desc(userTutorialBadges.earnedAt)]
      });

      // Fetch badge and tutorial details separately
      const badgeIds = userBadges.map(ub => ub.badgeId);
      const tutorialIds = userBadges.map(ub => ub.tutorialId).filter((id): id is string => id !== null);

      const badges = badgeIds.length > 0 
        ? await db.query.tutorialBadges.findMany({
            where: inArray(tutorialBadges.id, badgeIds)
          })
        : [];

      const tutorialsData = tutorialIds.length > 0
        ? await db.query.tutorials.findMany({
            where: inArray(tutorials.id, tutorialIds)
          })
        : [];

      // Create lookup maps
      const badgeMap = new Map(badges.map(b => [b.id, b]));
      const tutorialMap = new Map(tutorialsData.map(t => [t.id, t]));

      // Merge data
      const result = userBadges.map(ub => ({
        ...ub,
        badge: badgeMap.get(ub.badgeId) || null,
        tutorial: ub.tutorialId ? tutorialMap.get(ub.tutorialId) || null : null
      }));

      res.json(result);
    } catch (error: any) {
      console.error('[Badges] Error fetching user badges:', error);
      res.status(500).json({ error: 'Failed to fetch user badges', details: error.message });
    }
  });

  // Check and award badges based on tutorial completion
  app.post('/api/tutorials/badges/check', async (req, res) => {
    const userId = requireAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { tutorialId } = req.body;

      // Get all completed tutorials for user
      const completedTutorialRecords = await db.query.tutorialCompletions.findMany({
        where: and(
          eq(tutorialCompletions.userId, userId),
          eq(tutorialCompletions.isCompleted, true)
        )
      });

      const completionCount = completedTutorialRecords.length;

      // Fetch tutorial details separately
      const completedTutorialIds = completedTutorialRecords.map(c => c.tutorialId);
      const tutorialsData = completedTutorialIds.length > 0
        ? await db.query.tutorials.findMany({
            where: inArray(tutorials.id, completedTutorialIds)
          })
        : [];

      // Create tutorial lookup map
      const tutorialMap = new Map(tutorialsData.map(t => [t.id, t]));

      // Merge completion records with tutorial data
      const completedTutorials = completedTutorialRecords.map(c => ({
        ...c,
        tutorial: tutorialMap.get(c.tutorialId)!
      }));
      const newlyAwardedBadges = [];

      // Get all badges
      const allBadges = await db.query.tutorialBadges.findMany({
        where: eq(tutorialBadges.isActive, true)
      });

      // Get user's existing badges
      const existingBadges = await db.query.userTutorialBadges.findMany({
        where: eq(userTutorialBadges.userId, userId)
      });

      const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

      // Check each badge requirement
      for (const badge of allBadges) {
        if (existingBadgeIds.has(badge.id)) {
          continue; // Already earned
        }

        let shouldAward = false;

        // Milestone badges based on total completions
        if (badge.name === 'First Steps' && completionCount >= 1) {
          shouldAward = true;
        } else if (badge.name === 'Tutorial Novice' && completionCount >= 3) {
          shouldAward = true;
        } else if (badge.name === 'Tutorial Enthusiast' && completionCount >= 5) {
          shouldAward = true;
        } else if (badge.name === 'Tutorial Expert' && completionCount >= 10) {
          shouldAward = true;
        }

        // Category-specific badges
        if (badge.name === 'Payroll Master') {
          const payrollTutorials = completedTutorials.filter(c => c.tutorial.category === 'payroll');
          const totalPayrollTutorials = await db.query.tutorials.findMany({
            where: eq(tutorials.category, 'payroll')
          });
          if (payrollTutorials.length > 0 && payrollTutorials.length === totalPayrollTutorials.length) {
            shouldAward = true;
          }
        }

        if (badge.name === 'Hiring Guru') {
          const hiringTutorials = completedTutorials.filter(c => c.tutorial.category === 'hiring');
          const totalHiringTutorials = await db.query.tutorials.findMany({
            where: eq(tutorials.category, 'hiring')
          });
          if (hiringTutorials.length > 0 && hiringTutorials.length === totalHiringTutorials.length) {
            shouldAward = true;
          }
        }

        if (badge.name === 'AI Explorer') {
          const aiTutorial = completedTutorials.find(c => c.tutorial.title.includes('Studio AI'));
          if (aiTutorial) {
            shouldAward = true;
          }
        }

        // Award badge if criteria met
        if (shouldAward) {
          const [newBadge] = await db.insert(userTutorialBadges).values({
            userId,
            badgeId: badge.id,
            tutorialId: tutorialId || null
          }).returning();

          newlyAwardedBadges.push({
            ...newBadge,
            badge
          });
        }
      }

      res.json({
        newlyAwarded: newlyAwardedBadges,
        totalBadges: existingBadges.length + newlyAwardedBadges.length
      });
    } catch (error: any) {
      console.error('[Badges] Error checking badges:', error);
      res.status(500).json({ error: 'Failed to check badges', details: error.message });
    }
  });

  // Tax Jurisdiction Management Routes
  // RBAC: Only HR department and Product Owner can manage tax jurisdictions
  
  app.get('/api/tax-jurisdictions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const jurisdictions = await storage.getTaxJurisdictions();
      res.json(jurisdictions);
    } catch (error: any) {
      console.error('Error fetching tax jurisdictions:', error);
      res.status(500).json({ error: 'Failed to fetch tax jurisdictions', details: error.message });
    }
  });

  app.get('/api/tax-jurisdictions/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const jurisdiction = await storage.getTaxJurisdictionById(req.params.id);
      if (!jurisdiction) {
        return res.status(404).json({ error: 'Tax jurisdiction not found' });
      }

      res.json(jurisdiction);
    } catch (error: any) {
      console.error('Error fetching tax jurisdiction:', error);
      res.status(500).json({ error: 'Failed to fetch tax jurisdiction', details: error.message });
    }
  });

  app.post('/api/tax-jurisdictions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create tax jurisdictions' 
        });
      }

      const validated = insertTaxJurisdictionSchema.parse(req.body);
      const jurisdiction = await storage.createTaxJurisdiction(validated);
      res.status(201).json(jurisdiction);
    } catch (error: any) {
      console.error('Error creating tax jurisdiction:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create tax jurisdiction', details: error.message });
    }
  });

  app.put('/api/tax-jurisdictions/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can update tax jurisdictions' 
        });
      }

      const existing = await storage.getTaxJurisdictionById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Tax jurisdiction not found' });
      }

      const validated = insertTaxJurisdictionSchema.partial().parse(req.body);
      const updated = await storage.updateTaxJurisdiction(req.params.id, validated);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating tax jurisdiction:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update tax jurisdiction', details: error.message });
    }
  });

  app.delete('/api/tax-jurisdictions/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can delete tax jurisdictions' 
        });
      }

      const existing = await storage.getTaxJurisdictionById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Tax jurisdiction not found' });
      }

      await storage.deleteTaxJurisdiction(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting tax jurisdiction:', error);
      res.status(500).json({ error: 'Failed to delete tax jurisdiction', details: error.message });
    }
  });

  // Reciprocal Agreement Routes
  // RBAC: Only HR department and Product Owner can manage reciprocal agreements

  app.get('/api/reciprocal-agreements', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const agreements = await storage.getReciprocalAgreements();
      res.json(agreements);
    } catch (error: any) {
      console.error('Error fetching reciprocal agreements:', error);
      res.status(500).json({ error: 'Failed to fetch reciprocal agreements', details: error.message });
    }
  });

  app.get('/api/reciprocal-agreements/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const agreement = await storage.getReciprocalAgreementById(req.params.id);
      if (!agreement) {
        return res.status(404).json({ error: 'Reciprocal agreement not found' });
      }

      res.json(agreement);
    } catch (error: any) {
      console.error('Error fetching reciprocal agreement:', error);
      res.status(500).json({ error: 'Failed to fetch reciprocal agreement', details: error.message });
    }
  });

  app.post('/api/reciprocal-agreements', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create reciprocal agreements' 
        });
      }

      const validated = insertReciprocalAgreementSchema.parse(req.body);
      const agreement = await storage.createReciprocalAgreement(validated);
      res.status(201).json(agreement);
    } catch (error: any) {
      console.error('Error creating reciprocal agreement:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create reciprocal agreement', details: error.message });
    }
  });

  app.put('/api/reciprocal-agreements/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can update reciprocal agreements' 
        });
      }

      const existing = await storage.getReciprocalAgreementById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Reciprocal agreement not found' });
      }

      const validated = insertReciprocalAgreementSchema.partial().parse(req.body);
      const updated = await storage.updateReciprocalAgreement(req.params.id, validated);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating reciprocal agreement:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update reciprocal agreement', details: error.message });
    }
  });

  app.delete('/api/reciprocal-agreements/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can delete reciprocal agreements' 
        });
      }

      const existing = await storage.getReciprocalAgreementById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Reciprocal agreement not found' });
      }

      await storage.deleteReciprocalAgreement(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting reciprocal agreement:', error);
      res.status(500).json({ error: 'Failed to delete reciprocal agreement', details: error.message });
    }
  });

  // Tax Data Service Routes - Authoritative tax data for AI
  
  app.get('/api/tax-data/federal', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const federalTaxData = TaxDataService.getFederalTaxData();
      res.json(federalTaxData);
    } catch (error: any) {
      console.error('Error fetching federal tax data:', error);
      res.status(500).json({ error: 'Failed to fetch federal tax data', details: error.message });
    }
  });

  app.get('/api/tax-data/reciprocal-agreements', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const reciprocalData = TaxDataService.getReciprocalAgreements();
      res.json({ agreements: reciprocalData });
    } catch (error: any) {
      console.error('Error fetching reciprocal agreement data:', error);
      res.status(500).json({ error: 'Failed to fetch reciprocal agreement data', details: error.message });
    }
  });

  app.get('/api/tax-data/sources', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { dataType, taxYear } = req.query;
      let sources;
      
      if (dataType) {
        sources = await storage.getTaxDataSourcesByType(
          dataType as string,
          taxYear ? parseInt(taxYear as string) : undefined
        );
      } else {
        sources = await storage.getTaxDataSources();
      }

      res.json(sources);
    } catch (error: any) {
      console.error('Error fetching tax data sources:', error);
      res.status(500).json({ error: 'Failed to fetch tax data sources', details: error.message });
    }
  });

  app.post('/api/tax-data/sources/seed', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can seed tax data' 
        });
      }

      const federalDataSource = TaxDataService.generateFederalTaxDataSource();
      const reciprocalDataSource = TaxDataService.generateReciprocalAgreementsDataSource();

      const created = await Promise.all([
        storage.createTaxDataSource({ ...federalDataSource, verifiedBy: userId }),
        storage.createTaxDataSource({ ...reciprocalDataSource, verifiedBy: userId })
      ]);

      res.status(201).json({
        message: 'Tax data sources seeded successfully',
        sources: created
      });
    } catch (error: any) {
      console.error('Error seeding tax data sources:', error);
      res.status(500).json({ error: 'Failed to seed tax data sources', details: error.message });
    }
  });

  // AI Tax Suggestions Routes
  
  app.get('/api/ai-tax-suggestions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { status } = req.query;
      const suggestions = await storage.getAiTaxSuggestions(status as string | undefined);
      res.json(suggestions);
    } catch (error: any) {
      console.error('Error fetching AI tax suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch AI tax suggestions', details: error.message });
    }
  });

  app.post('/api/ai-tax-suggestions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create AI tax suggestions' 
        });
      }

      const suggestion = await storage.createAiTaxSuggestion({
        ...req.body,
        requestedBy: userId
      });

      res.status(201).json(suggestion);
    } catch (error: any) {
      console.error('Error creating AI tax suggestion:', error);
      res.status(500).json({ error: 'Failed to create AI tax suggestion', details: error.message });
    }
  });

  app.patch('/api/ai-tax-suggestions/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can review AI tax suggestions' 
        });
      }

      const existing = await storage.getAiTaxSuggestionById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'AI tax suggestion not found' });
      }

      const { status, reviewNotes } = req.body;
      const updated = await storage.updateAiTaxSuggestion(req.params.id, {
        status,
        reviewNotes,
        reviewedBy: userId,
        reviewedAt: new Date(),
        appliedAt: status === 'approved' ? new Date() : undefined
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating AI tax suggestion:', error);
      res.status(500).json({ error: 'Failed to update AI tax suggestion', details: error.message });
    }
  });

  // AI-Powered Tax Configuration Suggestions
  
  app.post('/api/ai-tax-suggestions/generate/:employeeId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can generate AI tax suggestions' 
        });
      }

      const { employeeId } = req.params;
      const employee = await storage.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Get employee profile for full name
      const profile = await storage.getProfileById(employee.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      // Generate AI suggestion
      const aiResult = await suggestTaxConfiguration({
        employeeId: employee.id,
        fullName: profile.fullName,
        workState: employee.state || 'Unknown',
        residenceState: req.body.residenceState || employee.state || 'Unknown',
        filingStatus: req.body.filingStatus
      });

      // Create AI tax suggestion record
      const suggestion = await storage.createAiTaxSuggestion({
        employeeId: employee.id,
        suggestionType: 'tax_jurisdiction',
        suggestedConfig: aiResult.suggestion,
        reasoning: aiResult.reasoning,
        confidence: aiResult.confidence,
        dataSourceIds: [], // Will be populated with tax data source IDs
        status: 'pending',
        requestedBy: userId
      });

      res.status(201).json({
        suggestion,
        complianceNotes: aiResult.complianceNotes,
        actionItems: aiResult.actionItems
      });
    } catch (error: any) {
      console.error('Error generating AI tax suggestion:', error);
      res.status(500).json({ error: 'Failed to generate AI tax suggestion', details: error.message });
    }
  });

  app.post('/api/ai-tax-suggestions/generate-batch', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can generate AI tax suggestions' 
        });
      }

      const { employeeIds } = req.body;
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: 'employeeIds must be a non-empty array' });
      }

      // Get all employees
      const employees = await Promise.all(
        employeeIds.map(id => storage.getEmployeeById(id))
      );

      // Filter out any null results
      const validEmployees = employees.filter(e => e !== null);
      if (validEmployees.length === 0) {
        return res.status(404).json({ error: 'No valid employees found' });
      }

      // Get profiles for full names
      const employeeData = await Promise.all(
        validEmployees.map(async (emp) => {
          const profile = await storage.getProfileById(emp.userId);
          return {
            employeeId: emp.id,
            fullName: profile?.fullName || 'Unknown',
            workState: emp.state || 'Unknown',
            residenceState: emp.state || 'Unknown', // TODO: Add residence state field to employee
            filingStatus: undefined
          };
        })
      );

      // Generate batch suggestions
      const aiResults = await batchSuggestTaxConfigurations(employeeData);

      // Create suggestion records
      const suggestions = await Promise.all(
        aiResults.map(result => 
          storage.createAiTaxSuggestion({
            employeeId: result.employeeId,
            suggestionType: 'tax_jurisdiction',
            suggestedConfig: result.suggestion,
            reasoning: result.reasoning,
            confidence: result.confidence,
            dataSourceIds: [],
            status: 'pending',
            requestedBy: userId
          })
        )
      );

      res.status(201).json({
        count: suggestions.length,
        suggestions
      });
    } catch (error: any) {
      console.error('Error generating batch AI tax suggestions:', error);
      res.status(500).json({ error: 'Failed to generate batch AI tax suggestions', details: error.message });
    }
  });

  // Employee Tax Configuration Routes
  // HR/Product Owner can manage all configs, employees can view their own

  app.get('/api/employee-tax-config/:employeeId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId } = req.params;
      
      const employee = await storage.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission && employee.userId !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden: You can only view your own tax configuration' 
        });
      }

      const config = await storage.getEmployeeTaxConfiguration(employeeId);
      if (!config) {
        return res.status(404).json({ error: 'Tax configuration not found for this employee' });
      }

      res.json(config);
    } catch (error: any) {
      console.error('Error fetching employee tax configuration:', error);
      res.status(500).json({ error: 'Failed to fetch employee tax configuration', details: error.message });
    }
  });

  app.post('/api/employee-tax-config/:employeeId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId } = req.params;

      const employee = await storage.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create tax configurations' 
        });
      }

      const existing = await storage.getEmployeeTaxConfiguration(employeeId);
      if (existing) {
        return res.status(400).json({ 
          error: 'Tax configuration already exists for this employee. Use PUT to update.' 
        });
      }

      const validated = insertEmployeeTaxConfigurationSchema.parse({
        ...req.body,
        employeeId
      });

      const config = await storage.createEmployeeTaxConfiguration(validated);
      res.status(201).json(config);
    } catch (error: any) {
      console.error('Error creating employee tax configuration:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create employee tax configuration', details: error.message });
    }
  });

  app.put('/api/employee-tax-config/:employeeId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId } = req.params;

      const employee = await storage.getEmployeeById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can update tax configurations' 
        });
      }

      const existing = await storage.getEmployeeTaxConfiguration(employeeId);
      if (!existing) {
        return res.status(404).json({ 
          error: 'Tax configuration not found. Use POST to create one.' 
        });
      }

      const validated = insertEmployeeTaxConfigurationSchema.partial().parse(req.body);
      const updated = await storage.updateEmployeeTaxConfiguration(existing.id, validated);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating employee tax configuration:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update employee tax configuration', details: error.message });
    }
  });

  // Auto-fix Audit Log Routes
  // GET: Available to all authenticated users
  // POST: Only HR/Product Owner can create audit logs (when approving auto-fixes)

  app.get('/api/auto-fix-audit', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const logs = await storage.getAutoFixAuditLogs();
      res.json(logs);
    } catch (error: any) {
      console.error('Error fetching auto-fix audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch auto-fix audit logs', details: error.message });
    }
  });

  app.get('/api/auto-fix-audit/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const log = await storage.getAutoFixAuditLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: 'Auto-fix audit log not found' });
      }

      res.json(log);
    } catch (error: any) {
      console.error('Error fetching auto-fix audit log:', error);
      res.status(500).json({ error: 'Failed to fetch auto-fix audit log', details: error.message });
    }
  });

  app.post('/api/auto-fix-audit', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create auto-fix audit logs' 
        });
      }

      const validated = insertAutoFixAuditLogSchema.parse({
        ...req.body,
        approvedBy: userId
      });

      const log = await storage.createAutoFixAuditLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      console.error('Error creating auto-fix audit log:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create auto-fix audit log', details: error.message });
    }
  });

  // Timesheet API Routes
  // These routes handle timesheet entry creation, approval workflows, and payroll locks
  
  // Bulk save timesheets (typically called when HR reviews Step 1 of payroll wizard)
  app.post('/api/timesheets/bulk-save', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can save timesheets' 
        });
      }

      const { timesheets, payPeriodStart, payPeriodEnd } = req.body;

      if (!Array.isArray(timesheets) || timesheets.length === 0) {
        return res.status(400).json({ error: 'Timesheets array is required and cannot be empty' });
      }

      if (!payPeriodStart || !payPeriodEnd) {
        return res.status(400).json({ error: 'Pay period dates are required' });
      }

      // Validate and prepare timesheet entries
      const timesheetEntries = timesheets.map(ts => ({
        employeeId: ts.employeeId,
        payPeriodStart,
        payPeriodEnd,
        regularHours: ts.regularHours || '0',
        overtimeHours: ts.overtimeHours || '0',
        ptoHours: ts.ptoHours || '0',
        sickHours: ts.sickHours || '0',
        holidayHours: ts.holidayHours || '0',
        status: 'Pending_Approval',
        submittedBy: userId,
        submittedAt: new Date(),
        notes: ts.notes || null
      }));

      // Check if timesheets already exist for this period and update/create accordingly
      const savedTimesheets = [];
      for (const entry of timesheetEntries) {
        const existing = await storage.getTimesheetEntryByEmployeeAndPeriod(
          entry.employeeId,
          entry.payPeriodStart,
          entry.payPeriodEnd
        );

        if (existing) {
          // Update existing timesheet
          const updated = await storage.updateTimesheetEntry(existing.id, entry);
          savedTimesheets.push(updated);
        } else {
          // Create new timesheet
          const created = await storage.createTimesheetEntry(entry);
          savedTimesheets.push(created);
        }
      }

      res.status(201).json({ 
        message: 'Timesheets saved successfully',
        timesheets: savedTimesheets
      });
    } catch (error: any) {
      console.error('Error saving timesheets:', error);
      res.status(500).json({ error: 'Failed to save timesheets', details: error.message });
    }
  });

  // Approve timesheets (manager or HR approval)
  app.post('/api/timesheets/approve', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can approve timesheets' 
        });
      }

      const { timesheetIds, payPeriodStart, payPeriodEnd } = req.body;

      if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
        return res.status(400).json({ error: 'Timesheet IDs array is required' });
      }

      // Update all timesheets to approved status and create approval records
      const approvals = [];
      for (const timesheetId of timesheetIds) {
        // Update status to Approved
        await storage.updateTimesheetEntry(timesheetId, { status: 'Approved' });

        // Create approval record
        const approval = await storage.createTimesheetApproval({
          timesheetId,
          approverId: userId,
          status: 'Approved',
          approvedAt: new Date(),
          comments: 'Approved via payroll wizard'
        });
        approvals.push(approval);
      }

      res.json({ 
        message: 'Timesheets approved successfully',
        approvals
      });
    } catch (error: any) {
      console.error('Error approving timesheets:', error);
      res.status(500).json({ error: 'Failed to approve timesheets', details: error.message });
    }
  });

  // Get approved timesheets for a pay period (used by auto-fix and payroll processing)
  app.get('/api/timesheets/approved', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { payPeriodStart, payPeriodEnd } = req.query;

      if (!payPeriodStart || !payPeriodEnd) {
        return res.status(400).json({ error: 'Pay period dates are required' });
      }

      const timesheets = await storage.getApprovedTimesheetsByPeriod(
        payPeriodStart as string,
        payPeriodEnd as string
      );

      res.json(timesheets);
    } catch (error: any) {
      console.error('Error fetching approved timesheets:', error);
      res.status(500).json({ error: 'Failed to fetch approved timesheets', details: error.message });
    }
  });

  // Create payroll lock (locks timesheets once payroll processing starts)
  app.post('/api/payroll-lock', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const hasPermission = await canManageAnnouncements(userId);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden: Only HR department and Product Owners can create payroll locks' 
        });
      }

      const { payPeriodStart, payPeriodEnd, employeeIds, notes } = req.body;

      if (!payPeriodStart || !payPeriodEnd) {
        return res.status(400).json({ error: 'Pay period dates are required' });
      }

      // Check if lock already exists
      const existingLock = await storage.getPayrollLock(payPeriodStart, payPeriodEnd);
      if (existingLock) {
        return res.status(409).json({ 
          error: 'Payroll lock already exists for this period',
          lock: existingLock
        });
      }

      // Get all approved timesheets for this period
      const approvedTimesheets = await storage.getApprovedTimesheetsByPeriod(
        payPeriodStart,
        payPeriodEnd
      );

      // Update all approved timesheets to Locked status
      for (const timesheet of approvedTimesheets) {
        await storage.updateTimesheetEntry(timesheet.id, { status: 'Locked' });
      }

      // Create payroll lock
      const lock = await storage.createPayrollLock({
        payPeriodStart,
        payPeriodEnd,
        status: 'Locked',
        lockedBy: userId,
        lockedAt: new Date(),
        employeeIds: employeeIds || approvedTimesheets.map(t => t.employeeId),
        notes: notes || 'Payroll processing started'
      });

      res.status(201).json({ 
        message: 'Payroll locked successfully',
        lock,
        timesheetsLocked: approvedTimesheets.length
      });
    } catch (error: any) {
      console.error('Error creating payroll lock:', error);
      res.status(500).json({ error: 'Failed to create payroll lock', details: error.message });
    }
  });

  // Get payroll lock status
  app.get('/api/payroll-lock/status', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { payPeriodStart, payPeriodEnd } = req.query;

      if (!payPeriodStart || !payPeriodEnd) {
        return res.status(400).json({ error: 'Pay period dates are required' });
      }

      const lock = await storage.getPayrollLock(
        payPeriodStart as string,
        payPeriodEnd as string
      );

      res.json({ 
        isLocked: !!lock,
        lock: lock || null
      });
    } catch (error: any) {
      console.error('Error checking payroll lock status:', error);
      res.status(500).json({ error: 'Failed to check payroll lock status', details: error.message });
    }
  });

  // Permission Management API Routes
  
  // Get all permissions (optionally filtered by category)
  app.get('/api/permissions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { category } = req.query;

      let permissions;
      if (category) {
        permissions = await storage.getPermissionsByCategory(category as string);
      } else {
        permissions = await storage.getPermissions();
      }

      res.json(permissions);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions', details: error.message });
    }
  });

  // Get role permissions
  app.get('/api/permissions/role/:role', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { role } = req.params;
      const rolePermissions = await storage.getRolePermissions(role);
      
      res.json(rolePermissions);
    } catch (error: any) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({ error: 'Failed to fetch role permissions', details: error.message });
    }
  });

  // Check if role has specific permission
  app.get('/api/permissions/check/:role/:permissionCode', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { role, permissionCode } = req.params;
      const hasPermission = await storage.hasPermission(role, permissionCode);
      
      res.json({ hasPermission });
    } catch (error: any) {
      console.error('Error checking permission:', error);
      res.status(500).json({ error: 'Failed to check permission', details: error.message });
    }
  });

  // Create new permission (HR/Product Owner only)
  app.post('/api/permissions', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - HR or Product Owner role required' });
      }

      const { code, category, name, description } = req.body;

      if (!code || !category || !name) {
        return res.status(400).json({ error: 'Code, category, and name are required' });
      }

      const permission = await storage.createPermission({
        code,
        category,
        name,
        description
      });

      res.status(201).json(permission);
    } catch (error: any) {
      console.error('Error creating permission:', error);
      res.status(500).json({ error: 'Failed to create permission', details: error.message });
    }
  });

  // Assign permission to role (HR/Product Owner only)
  app.post('/api/permissions/assign', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - HR or Product Owner role required' });
      }

      const { role, permissionId } = req.body;

      if (!role || !permissionId) {
        return res.status(400).json({ error: 'Role and permissionId are required' });
      }

      const rolePermission = await storage.assignPermissionToRole({
        role,
        permissionId
      });

      res.status(201).json(rolePermission);
    } catch (error: any) {
      console.error('Error assigning permission to role:', error);
      res.status(500).json({ error: 'Failed to assign permission', details: error.message });
    }
  });

  // Revoke permission from role (HR/Product Owner only)
  app.delete('/api/permissions/revoke', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - HR or Product Owner role required' });
      }

      const { role, permissionId } = req.body;

      if (!role || !permissionId) {
        return res.status(400).json({ error: 'Role and permissionId are required' });
      }

      await storage.revokePermissionFromRole(role, permissionId);

      res.json({ message: 'Permission revoked successfully' });
    } catch (error: any) {
      console.error('Error revoking permission from role:', error);
      res.status(500).json({ error: 'Failed to revoke permission', details: error.message });
    }
  });

  // Timesheet Correction Request API Routes

  // Get correction requests (filtered by user role)
  app.get('/api/timesheet-corrections', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const { status, timesheetEntryId } = req.query;
      let filters: any = {};

      if (status) {
        filters.status = status as string;
      }

      if (timesheetEntryId) {
        filters.timesheetEntryId = timesheetEntryId as string;
      }

      // Employees can only see their own requests
      if (userProfile.role === 'Employee') {
        filters.requestedById = userId;
      }

      const correctionRequests = await storage.getCorrectionRequests(filters);
      res.json(correctionRequests);
    } catch (error: any) {
      console.error('Error fetching correction requests:', error);
      res.status(500).json({ error: 'Failed to fetch correction requests', details: error.message });
    }
  });

  // Create correction request
  app.post('/api/timesheet-corrections', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { timesheetEntryId, originalValues, requestedValues, justification, supportingDocuments } = req.body;

      if (!timesheetEntryId || !originalValues || !requestedValues || !justification) {
        return res.status(400).json({ 
          error: 'Timesheet entry ID, original values, requested values, and justification are required' 
        });
      }

      // Verify the timesheet entry exists and get employee info
      const employee = await storage.getEmployeeById(userId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const correctionRequest = await storage.createCorrectionRequest({
        timesheetEntryId,
        requestedById: userId,
        originalValues,
        requestedValues,
        justification,
        supportingDocuments: supportingDocuments || null,
        status: 'Pending'
      });

      // Create audit trail entry
      await storage.createTimesheetChangeAudit({
        timesheetEntryId,
        changedBy: userId,
        changeType: 'Employee_Edit',
        oldValues: originalValues,
        newValues: requestedValues,
        justification,
        correctionRequestId: correctionRequest.id
      });

      res.status(201).json(correctionRequest);
    } catch (error: any) {
      console.error('Error creating correction request:', error);
      res.status(500).json({ error: 'Failed to create correction request', details: error.message });
    }
  });

  // Approve correction request (Manager/HR only)
  app.post('/api/timesheet-corrections/:id/approve', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'Manager' && userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - Manager, HR, or Product Owner role required' });
      }

      const { id } = req.params;
      const { reviewNotes } = req.body;

      // Determine change type based on reviewer role
      const changeType = userProfile.role === 'Manager' ? 'Manager_Correction' : 'HR_Override';

      // Execute atomic approval (all 3 operations in a single transaction)
      const approvedRequest = await storage.approveCorrectionRequestAtomic(
        id,
        userId,
        changeType,
        reviewNotes
      );

      res.json({ 
        message: 'Correction request approved and changes applied',
        correctionRequest: approvedRequest 
      });
    } catch (error: any) {
      console.error('Error approving correction request:', error);
      res.status(500).json({ error: 'Failed to approve correction request', details: error.message });
    }
  });

  // Reject correction request (Manager/HR only)
  app.post('/api/timesheet-corrections/:id/reject', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'Manager' && userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - Manager, HR, or Product Owner role required' });
      }

      const { id } = req.params;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        return res.status(400).json({ error: 'Review notes are required when rejecting a correction request' });
      }

      // Execute atomic rejection (all validation + update in a single transaction)
      const rejectedRequest = await storage.rejectCorrectionRequestAtomic(id, userId, reviewNotes);

      res.json({ 
        message: 'Correction request rejected',
        correctionRequest: rejectedRequest 
      });
    } catch (error: any) {
      console.error('Error rejecting correction request:', error);
      res.status(500).json({ error: 'Failed to reject correction request', details: error.message });
    }
  });

  // Get audit trail for a timesheet entry
  app.get('/api/timesheet-audit/:timesheetEntryId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const { timesheetEntryId } = req.params;

      // Verify user has permission to view this audit trail
      // Employees can only view their own, Managers/HR can view all
      if (userProfile.role === 'Employee') {
        const employee = await storage.getEmployeeById(userId);
        if (!employee) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        // Additional check could be added here to verify the timesheet belongs to this employee
      }

      const auditTrail = await storage.getTimesheetChangeAudit(timesheetEntryId);
      res.json(auditTrail);
    } catch (error: any) {
      console.error('Error fetching timesheet audit trail:', error);
      res.status(500).json({ error: 'Failed to fetch audit trail', details: error.message });
    }
  });

  // **PHASE 3: ADVANCED ACCESS CONTROL - API ENDPOINTS**

  // Helper function to check HR/Product Owner authorization
  async function requireHROrProductOwner(req: any, res: any): Promise<string | null> {
    const userId = requireAuth(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return null;
    }

    const userProfile = await storage.getProfileById(userId);
    if (!userProfile) {
      res.status(404).json({ error: 'User profile not found' });
      return null;
    }

    if (userProfile.department !== 'HR' && userProfile.role !== 'Product Owner') {
      res.status(403).json({ error: 'Forbidden: HR or Product Owner role required' });
      return null;
    }

    return userId;
  }

  // Helper function to check Manager/HR authorization
  async function requireManagerOrHR(req: any, res: any): Promise<string | null> {
    const userId = requireAuth(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return null;
    }

    const userProfile = await storage.getProfileById(userId);
    if (!userProfile) {
      res.status(404).json({ error: 'User profile not found' });
      return null;
    }

    if (userProfile.role !== 'Manager' && userProfile.department !== 'HR' && userProfile.role !== 'Product Owner') {
      res.status(403).json({ error: 'Forbidden: Manager or HR role required' });
      return null;
    }

    return userId;
  }

  // ========== PERMISSION TEMPLATES ==========

  // GET /api/permissions/templates - List all templates (HR/Product Owner only)
  app.get('/api/permissions/templates', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const templates = await storage.getPermissionTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching permission templates:', error);
      res.status(500).json({ error: 'Failed to fetch permission templates', details: error.message });
    }
  });

  // GET /api/permissions/templates/:id - Get template by ID (HR/Product Owner only)
  app.get('/api/permissions/templates/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      const template = await storage.getPermissionTemplateById(id);

      if (!template) {
        return res.status(404).json({ error: 'Permission template not found' });
      }

      res.json(template);
    } catch (error: any) {
      console.error('Error fetching permission template:', error);
      res.status(500).json({ error: 'Failed to fetch permission template', details: error.message });
    }
  });

  // POST /api/permissions/templates - Create template (HR/Product Owner only)
  app.post('/api/permissions/templates', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const validated = insertPermissionTemplateSchema.parse(req.body);
      const template = await storage.createPermissionTemplate(validated);

      res.status(201).json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating permission template:', error);
      res.status(500).json({ error: 'Failed to create permission template', details: error.message });
    }
  });

  // PUT /api/permissions/templates/:id - Update template (HR/Product Owner only)
  app.put('/api/permissions/templates/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      
      // Check if template exists
      const existingTemplate = await storage.getPermissionTemplateById(id);
      if (!existingTemplate) {
        return res.status(404).json({ error: 'Permission template not found' });
      }

      // Validate partial update
      const validated = insertPermissionTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updatePermissionTemplate(id, validated);

      res.json(updatedTemplate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating permission template:', error);
      res.status(500).json({ error: 'Failed to update permission template', details: error.message });
    }
  });

  // DELETE /api/permissions/templates/:id - Delete template (HR/Product Owner only)
  app.delete('/api/permissions/templates/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      
      // Check if template exists and is not a system template
      const template = await storage.getPermissionTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: 'Permission template not found' });
      }

      if (template.isSystemTemplate) {
        return res.status(403).json({ error: 'Cannot delete system templates' });
      }

      await storage.deletePermissionTemplate(id);
      res.json({ message: 'Permission template deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting permission template:', error);
      res.status(500).json({ error: 'Failed to delete permission template', details: error.message });
    }
  });

  // POST /api/permissions/templates/:id/apply - Apply template to role (HR/Product Owner only)
  app.post('/api/permissions/templates/:id/apply', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { role, appliedBy } = req.body;

      if (!role || !appliedBy) {
        return res.status(400).json({ error: 'role and appliedBy are required' });
      }

      // Check if template exists
      const template = await storage.getPermissionTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: 'Permission template not found' });
      }

      await storage.applyTemplateToRole(id, role, appliedBy);
      res.json({ message: 'Template applied to role successfully' });
    } catch (error: any) {
      console.error('Error applying permission template:', error);
      res.status(500).json({ error: 'Failed to apply permission template', details: error.message });
    }
  });

  // ========== ROLE HIERARCHY ==========

  // GET /api/permissions/hierarchy - Get all hierarchy (HR/Product Owner only)
  app.get('/api/permissions/hierarchy', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const hierarchy = await storage.getRoleHierarchy();
      res.json(hierarchy);
    } catch (error: any) {
      console.error('Error fetching role hierarchy:', error);
      res.status(500).json({ error: 'Failed to fetch role hierarchy', details: error.message });
    }
  });

  // GET /api/permissions/hierarchy/:role - Get hierarchy for role (HR/Product Owner only)
  app.get('/api/permissions/hierarchy/:role', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role } = req.params;
      const hierarchy = await storage.getRoleHierarchyByRole(role);

      if (!hierarchy) {
        return res.status(404).json({ error: 'Role hierarchy not found' });
      }

      res.json(hierarchy);
    } catch (error: any) {
      console.error('Error fetching role hierarchy:', error);
      res.status(500).json({ error: 'Failed to fetch role hierarchy', details: error.message });
    }
  });

  // GET /api/permissions/hierarchy/:role/inherited - Get inherited permissions for role (HR/Product Owner only)
  app.get('/api/permissions/hierarchy/:role/inherited', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role } = req.params;
      const inheritedPermissions = await storage.getInheritedPermissions(role);

      res.json(inheritedPermissions);
    } catch (error: any) {
      console.error('Error fetching inherited permissions:', error);
      res.status(500).json({ error: 'Failed to fetch inherited permissions', details: error.message });
    }
  });

  // POST /api/permissions/hierarchy - Create hierarchy (HR/Product Owner only)
  app.post('/api/permissions/hierarchy', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const validated = insertRoleHierarchySchema.parse(req.body);
      const hierarchy = await storage.createRoleHierarchy(validated);

      res.status(201).json(hierarchy);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating role hierarchy:', error);
      res.status(500).json({ error: 'Failed to create role hierarchy', details: error.message });
    }
  });

  // PUT /api/permissions/hierarchy/:id - Update hierarchy (HR/Product Owner only)
  app.put('/api/permissions/hierarchy/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      
      // Validate partial update
      const validated = insertRoleHierarchySchema.partial().parse(req.body);
      const updatedHierarchy = await storage.updateRoleHierarchy(id, validated);

      if (!updatedHierarchy) {
        return res.status(404).json({ error: 'Role hierarchy not found' });
      }

      res.json(updatedHierarchy);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error updating role hierarchy:', error);
      res.status(500).json({ error: 'Failed to update role hierarchy', details: error.message });
    }
  });

  // ========== TIME-BASED GRANTS ==========

  // GET /api/permissions/grants - Get all grants, optionally filter by userId (HR/Product Owner only)
  app.get('/api/permissions/grants', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { userId: filterUserId } = req.query;
      const grants = await storage.getAllTimeBasedGrants(filterUserId as string | undefined);

      res.json(grants);
    } catch (error: any) {
      console.error('Error fetching time-based grants:', error);
      res.status(500).json({ error: 'Failed to fetch time-based grants', details: error.message });
    }
  });

  // GET /api/permissions/grants/active/:userId - Get active grants for user (HR/Product Owner only)
  app.get('/api/permissions/grants/active/:userId', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { userId: targetUserId } = req.params;
      const grants = await storage.getActiveTimeBasedGrants(targetUserId);

      res.json(grants);
    } catch (error: any) {
      console.error('Error fetching active grants:', error);
      res.status(500).json({ error: 'Failed to fetch active grants', details: error.message });
    }
  });

  // POST /api/permissions/grants - Create grant (HR/Product Owner only)
  app.post('/api/permissions/grants', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const validated = insertTimeBasedPermissionGrantSchema.parse(req.body);
      const grant = await storage.createTimeBasedGrant(validated);

      res.status(201).json(grant);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating time-based grant:', error);
      res.status(500).json({ error: 'Failed to create time-based grant', details: error.message });
    }
  });

  // DELETE /api/permissions/grants/:id/revoke - Revoke grant (HR/Product Owner only)
  app.delete('/api/permissions/grants/:id/revoke', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { revokedBy } = req.body;

      if (!revokedBy) {
        return res.status(400).json({ error: 'revokedBy is required' });
      }

      await storage.revokeTimeBasedGrant(id, revokedBy);
      res.json({ message: 'Grant revoked successfully' });
    } catch (error: any) {
      console.error('Error revoking time-based grant:', error);
      res.status(500).json({ error: 'Failed to revoke time-based grant', details: error.message });
    }
  });

  // POST /api/permissions/grants/expire - Expire old grants (HR/Product Owner only)
  app.post('/api/permissions/grants/expire', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const expiredCount = await storage.expireOldGrants();
      res.json({ expired: expiredCount });
    } catch (error: any) {
      console.error('Error expiring grants:', error);
      res.status(500).json({ error: 'Failed to expire grants', details: error.message });
    }
  });

  // ========== PERMISSION REQUESTS ==========

  // GET /api/permissions/requests - Get requests with filters (HR/Manager for all, Employee for own)
  app.get('/api/permissions/requests', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const { status, requestedById } = req.query;

      // Employees can only view their own requests
      const filters: { requestedById?: string; status?: string } = {};
      
      if (userProfile.role === 'Employee') {
        filters.requestedById = userId;
      } else if (requestedById) {
        filters.requestedById = requestedById as string;
      }
      
      if (status) {
        filters.status = status as string;
      }

      const requests = await storage.getPermissionRequests(filters);
      res.json(requests);
    } catch (error: any) {
      console.error('Error fetching permission requests:', error);
      res.status(500).json({ error: 'Failed to fetch permission requests', details: error.message });
    }
  });

  // GET /api/permissions/requests/:id - Get request by ID (HR/Manager/requestor only)
  app.get('/api/permissions/requests/:id', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const { id } = req.params;
      const request = await storage.getPermissionRequestById(id);

      if (!request) {
        return res.status(404).json({ error: 'Permission request not found' });
      }

      // Check authorization: HR/Manager can view all, Employees can only view their own
      if (userProfile.role === 'Employee' && request.requestedById !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own requests' });
      }

      res.json(request);
    } catch (error: any) {
      console.error('Error fetching permission request:', error);
      res.status(500).json({ error: 'Failed to fetch permission request', details: error.message });
    }
  });

  // POST /api/permissions/requests - Create request (any authenticated user)
  app.post('/api/permissions/requests', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validated = insertPermissionRequestSchema.parse(req.body);
      const request = await storage.createPermissionRequest(validated);

      res.status(201).json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Error creating permission request:', error);
      res.status(500).json({ error: 'Failed to create permission request', details: error.message });
    }
  });

  // POST /api/permissions/requests/:id/approve - Approve request (HR/Manager only)
  app.post('/api/permissions/requests/:id/approve', async (req, res) => {
    try {
      const userId = await requireManagerOrHR(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { reviewerId, reviewNotes } = req.body;

      if (!reviewerId) {
        return res.status(400).json({ error: 'reviewerId is required' });
      }

      const approvedRequest = await storage.approvePermissionRequest(id, reviewerId, reviewNotes);
      res.json(approvedRequest);
    } catch (error: any) {
      console.error('Error approving permission request:', error);
      res.status(500).json({ error: 'Failed to approve permission request', details: error.message });
    }
  });

  // POST /api/permissions/requests/:id/reject - Reject request (HR/Manager only)
  app.post('/api/permissions/requests/:id/reject', async (req, res) => {
    try {
      const userId = await requireManagerOrHR(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { reviewerId, reviewNotes } = req.body;

      if (!reviewerId || !reviewNotes) {
        return res.status(400).json({ error: 'reviewerId and reviewNotes are required' });
      }

      const rejectedRequest = await storage.rejectPermissionRequest(id, reviewerId, reviewNotes);
      res.json(rejectedRequest);
    } catch (error: any) {
      console.error('Error rejecting permission request:', error);
      res.status(500).json({ error: 'Failed to reject permission request', details: error.message });
    }
  });

  // ========== BULK OPERATIONS ==========

  // POST /api/permissions/bulk/assign - Bulk assign (HR/Product Owner only)
  app.post('/api/permissions/bulk/assign', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role, permissionIds, assignedBy, reason } = req.body;

      if (!role || !permissionIds || !assignedBy) {
        return res.status(400).json({ error: 'role, permissionIds, and assignedBy are required' });
      }

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds must be an array' });
      }

      await storage.bulkAssignPermissions(role, permissionIds, assignedBy, reason);
      res.json({ message: 'Permissions assigned successfully' });
    } catch (error: any) {
      console.error('Error bulk assigning permissions:', error);
      res.status(500).json({ error: 'Failed to bulk assign permissions', details: error.message });
    }
  });

  // POST /api/permissions/bulk/revoke - Bulk revoke (HR/Product Owner only)
  app.post('/api/permissions/bulk/revoke', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role, permissionIds, revokedBy, reason } = req.body;

      if (!role || !permissionIds || !revokedBy) {
        return res.status(400).json({ error: 'role, permissionIds, and revokedBy are required' });
      }

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds must be an array' });
      }

      await storage.bulkRevokePermissions(role, permissionIds, revokedBy, reason);
      res.json({ message: 'Permissions revoked successfully' });
    } catch (error: any) {
      console.error('Error bulk revoking permissions:', error);
      res.status(500).json({ error: 'Failed to bulk revoke permissions', details: error.message });
    }
  });

  // ========== ACCESS LEVELS ==========

  // GET /api/access-levels - Get all access levels (authenticated users)
  app.get('/api/access-levels', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const levels = await storage.getAccessLevels();
      res.json(levels);
    } catch (error: any) {
      console.error('Error fetching access levels:', error);
      res.status(500).json({ error: 'Failed to fetch access levels', details: error.message });
    }
  });

  // POST /api/access-levels - Create new access level (HR/Product Owner only)
  app.post('/api/access-levels', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { name, description, priority } = req.body;

      if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
      }

      // Canonical code generation on server
      const code = name.toLowerCase().replace(/\s+/g, '_');

      const accessLevel = await storage.createAccessLevel({
        name,
        code,
        description,
        priority: priority ?? 0
      });

      res.status(201).json(accessLevel);
    } catch (error: any) {
      console.error('Error creating access level:', error);
      // Handle unique constraint violation
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(409).json({ error: 'An access level with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to create access level', details: error.message });
    }
  });

  // PATCH /api/access-levels/:id - Update access level (HR/Product Owner only)
  app.patch('/api/access-levels/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { name, code, description, priority } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (code !== undefined) updates.code = code;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;

      const accessLevel = await storage.updateAccessLevel(id, updates);
      
      if (!accessLevel) {
        return res.status(404).json({ error: 'Access level not found' });
      }

      res.json(accessLevel);
    } catch (error: any) {
      console.error('Error updating access level:', error);
      res.status(500).json({ error: 'Failed to update access level', details: error.message });
    }
  });

  // DELETE /api/access-levels/:id - Delete access level (HR/Product Owner only)
  app.delete('/api/access-levels/:id', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { id } = req.params;

      // Check if any employees are assigned this access level
      const assignments = await storage.getEmployeeAccessAssignments();
      const hasAssignments = assignments.some(a => a.accessLevelId === id);

      if (hasAssignments) {
        return res.status(409).json({ 
          error: 'Cannot delete this access level because employees are assigned to it. Please reassign employees first.' 
        });
      }

      await storage.deleteAccessLevel(id);
      res.json({ message: 'Access level deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting access level:', error);
      res.status(500).json({ error: 'Failed to delete access level', details: error.message });
    }
  });

  // ========== EMPLOYEE ACCESS ASSIGNMENTS ==========

  // GET /api/employee-access/assignments - Get all assignments (HR/Product Owner only)
  app.get('/api/employee-access/assignments', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userProfile = await storage.getProfileById(userId);
      if (!userProfile || (userProfile.role !== 'HR' && userProfile.role !== 'Product Owner')) {
        return res.status(403).json({ error: 'Unauthorized - HR or Product Owner role required' });
      }

      const assignments = await storage.getEmployeeAccessAssignments();
      res.json(assignments);
    } catch (error: any) {
      console.error('Error fetching employee access assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
    }
  });

  // GET /api/employee-access/assignments/:employeeId - Get assignment for specific employee
  app.get('/api/employee-access/assignments/:employeeId', async (req, res) => {
    try {
      const userId = requireAuth(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { employeeId } = req.params;
      const assignment = await storage.getEmployeeAccessAssignmentByEmployeeId(employeeId);
      res.json(assignment || null);
    } catch (error: any) {
      console.error('Error fetching employee access assignment:', error);
      res.status(500).json({ error: 'Failed to fetch assignment', details: error.message });
    }
  });

  // POST /api/employee-access/assign - Assign access level to employee (HR/Product Owner only)
  app.post('/api/employee-access/assign', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { employeeId, accessLevelId, source, aiConfidence } = req.body;

      if (!employeeId || !accessLevelId) {
        return res.status(400).json({ error: 'employeeId and accessLevelId are required' });
      }

      const assignment = await storage.assignEmployeeAccessLevel({
        employeeId,
        accessLevelId,
        assignedBy: userId,
        source: source || 'manual',
        aiConfidence: aiConfidence || null
      });

      res.json(assignment);
    } catch (error: any) {
      console.error('Error assigning employee access level:', error);
      res.status(500).json({ error: 'Failed to assign access level', details: error.message });
    }
  });

  // POST /api/employee-access/bulk-assign - Bulk assign access levels (HR/Product Owner only)
  app.post('/api/employee-access/bulk-assign', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { assignments } = req.body;

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({ error: 'assignments array is required' });
      }

      // Add assignedBy to each assignment
      const assignmentsWithUser = assignments.map(a => ({
        ...a,
        assignedBy: userId
      }));

      await storage.bulkAssignEmployeeAccessLevels(assignmentsWithUser);
      res.json({ message: 'Access levels assigned successfully', count: assignments.length });
    } catch (error: any) {
      console.error('Error bulk assigning employee access levels:', error);
      res.status(500).json({ error: 'Failed to bulk assign access levels', details: error.message });
    }
  });

  // DELETE /api/employee-access/revoke/:employeeId - Revoke access level from employee (HR/Product Owner only)
  app.delete('/api/employee-access/revoke/:employeeId', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { employeeId } = req.params;

      await storage.revokeEmployeeAccessLevel(employeeId);
      res.json({ message: 'Access level revoked successfully' });
    } catch (error: any) {
      console.error('Error revoking employee access level:', error);
      res.status(500).json({ error: 'Failed to revoke access level', details: error.message });
    }
  });

  // ========== AUDIT TRAIL ==========

  // GET /api/permissions/audit - Get audit trail with filters (HR/Product Owner only)
  app.get('/api/permissions/audit', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { targetType, targetId } = req.query;
      const auditTrail = await storage.getPermissionChangeAudit(
        targetType as string | undefined,
        targetId as string | undefined
      );

      res.json(auditTrail);
    } catch (error: any) {
      console.error('Error fetching permission audit trail:', error);
      res.status(500).json({ error: 'Failed to fetch permission audit trail', details: error.message });
    }
  });

  // ========== AI-POWERED FEATURES ==========

  // POST /api/permissions/ai/suggest - Get AI permission suggestions for a role
  app.post('/api/permissions/ai/suggest', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role, description } = req.body;
      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }

      const { aiPermissionService } = await import('./ai-permission-service.js');
      const suggestions = await aiPermissionService.suggestPermissionsForRole(role, description);

      res.json(suggestions);
    } catch (error: any) {
      console.error('Error getting AI permission suggestions:', error);
      res.status(500).json({ error: 'Failed to get AI suggestions', details: error.message });
    }
  });

  // POST /api/permissions/ai/template - Generate complete template suggestion
  app.post('/api/permissions/ai/template', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { role, description } = req.body;
      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }

      const { aiPermissionService } = await import('./ai-permission-service.js');
      const template = await aiPermissionService.generateTemplate(role, description);

      if (!template) {
        return res.status(404).json({ error: 'No template suggestions available' });
      }

      res.json(template);
    } catch (error: any) {
      console.error('Error generating AI template:', error);
      res.status(500).json({ error: 'Failed to generate AI template', details: error.message });
    }
  });

  // POST /api/permissions/ai/risk-analysis - Analyze permission combination risk
  app.post('/api/permissions/ai/risk-analysis', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { permissionIds } = req.body;
      if (!permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds array is required' });
      }

      const { aiPermissionService } = await import('./ai-permission-service.js');
      const analysis = await aiPermissionService.analyzePermissionRisk(permissionIds);

      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing permission risk:', error);
      res.status(500).json({ error: 'Failed to analyze permission risk', details: error.message });
    }
  });

  // POST /api/permissions/ai/hierarchy - Suggest role hierarchy
  app.post('/api/permissions/ai/hierarchy', async (req, res) => {
    try {
      const userId = await requireHROrProductOwner(req, res);
      if (!userId) return;

      const { roles } = req.body;
      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({ error: 'roles array is required' });
      }

      const { aiPermissionService } = await import('./ai-permission-service.js');
      const suggestions = await aiPermissionService.suggestRoleHierarchy(roles);

      res.json(suggestions);
    } catch (error: any) {
      console.error('Error suggesting role hierarchy:', error);
      res.status(500).json({ error: 'Failed to suggest role hierarchy', details: error.message });
    }
  });
}
