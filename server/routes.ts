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
  profiles,
  authCredentials,
  passwordResetTokens,
  passwordAuditLog,
  paycheckFunFacts,
  tutorials,
  tutorialSteps,
  tutorialCompletions
} from '../shared/schema.js';
import { sendCollaboratorInviteEmail, sendCollaboratorAcceptedEmail } from './emailService.js';
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
  chatWithStudioAI,
  generateHiringInsights,
  runDailyScreeningWorkflow,
  validatePayrollRun,
  analyzeExpenses,
  chatWithPayrollAI
} from './ai-agent.js';

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

  // Get presigned URL for uploading objects (authenticated)
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Server-side validation for file uploads
      const { fileName, fileSize, fileType } = req.body;
      
      // Validate required fields
      if (!fileName || !fileSize || !fileType) {
        return res.status(400).json({ error: 'fileName, fileSize, and fileType are required' });
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

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // SECURITY: Extract canonical object path in `/objects/...` format
      // Parse the presigned URL to get only the path component
      const url = new URL(uploadURL);
      const objectKey = url.pathname; // This gives us `/objects/uploads/...` format
      
      // Generate a secure upload token
      const uploadToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track this upload token with server-owned canonical key (expires in 1 hour)
      issuedUploadTokens.set(uploadToken, {
        userId,
        objectKey, // Server-generated canonical key - never trust client input
        uploadURL,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      });
      
      res.json({ uploadURL, uploadToken });
    } catch (error: any) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
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
      const updateData = hasSensitiveFields && hasPrivilegedRole
        ? req.body  // Include all fields for privileged users
        : basicFields;  // Only basic fields for regular users

      const profile = await storage.updateProfile(targetProfileId, updateData);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee routes
  // Note: Specific routes must come before parametric routes
  app.get('/api/employees/directory', async (req, res) => {
    try {
      const employees = await storage.getEmployeesWithProfiles();
      res.json(employees);
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
      res.json(messages);
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
      
      const validated = insertChatMessageSchema.parse(messageData);
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
        const { getAIResponse } = await import('./ai-assistant');
        
        // Generate AI response based on user message
        // Use plainContent (extracted above for security) if available, otherwise use encryptedContent
        const userMessage = plainContent || message.encryptedContent;
        const aiResponse = getAIResponse(userMessage);
        
        // Create AI response message with dedicated AI sender identity
        // Use special null UUID to represent AI Assistant (00000000-0000-0000-0000-000000000000)
        const AI_ASSISTANT_ID = '00000000-0000-0000-0000-000000000000';
        
        const aiMessageData = {
          channelId: req.params.channelId,
          senderId: AI_ASSISTANT_ID, // Dedicated AI sender identity
          encryptedContent: aiResponse,
          messageType: 'system' // System messages aren't encrypted
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
      res.status(400).json({ error: error.message });
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
        return res.status(400).json({ error: 'userId and isTyping are required' });
      }
      
      if (isTyping) {
        const indicatorData = {
          channelId: req.params.channelId,
          userId
          // startedTypingAt is auto-generated by the database
        };
        const validated = insertTypingIndicatorSchema.parse(indicatorData);
        const indicator = await storage.setTypingIndicator(validated);
        res.json(indicator);
      } else {
        await storage.removeTypingIndicator(req.params.channelId, userId);
        res.json({ success: true });
      }
    } catch (error: any) {
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

  // AI Assistant chat endpoint (simplified version)
  app.post('/api/ai-assistant/chat', async (req, res) => {
    try {
      const { message, userId } = req.body;

      if (!message || !userId) {
        return res.status(400).json({ error: 'Message and userId are required' });
      }

      // Get user profile
      const profile = await storage.getProfileById(userId);
      const firstName = profile?.firstName || 'there';

      // Simple AI response logic
      const messageLower = message.toLowerCase();
      let response = '';

      if (messageLower.includes('benefit')) {
        response = `Hi ${firstName}! I'd be happy to help with benefits information. 🏥\n\nWe offer comprehensive benefits including health, dental, and vision insurance, 401(k) with company match, paid time off, and more. Check the Benefits & Pay section for details!`;
      } else if (messageLower.includes('pto') || messageLower.includes('time off') || messageLower.includes('vacation')) {
        response = `Hi ${firstName}! For PTO inquiries, go to Leave Management to view your balance and request time off. Your manager typically responds within 24-48 hours.`;
      } else if (messageLower.includes('pay') || messageLower.includes('payroll')) {
        response = `Hi ${firstName}! For payroll questions, paychecks are issued bi-weekly on Fridays. Go to Payroll in your dashboard to view pay stubs, update direct deposit, and more.`;
      } else {
        response = `Hi ${firstName}! 👋 I'm Studio, your HRStudio360 AI Assistant. I can help with HR questions, benefits, PTO, payroll, and more. What can I help you with?`;
      }

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

      // Fetch all published tutorials that the user has access to
      const allTutorials = await db.query.tutorials.findMany({
        where: and(
          eq(tutorials.isPublished, true)
        ),
        orderBy: [asc(tutorials.sortOrder), asc(tutorials.createdAt)]
      });

      // Filter tutorials by role access
      const accessibleTutorials = allTutorials.filter(tutorial => 
        tutorial.roleAccess.includes(userRole)
      );

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

      // Seed tutorial data will be added in next task
      const tutorialData = [
        {
          title: 'Getting Started with HRStudio360',
          description: 'Learn the basics of navigating HRStudio360 and setting up your profile.',
          category: 'getting-started' as const,
          difficulty: 'beginner' as const,
          estimatedMinutes: 10,
          roleAccess: ['Employee', 'Manager', 'HR', 'Product Owner'],
          tags: ['basics', 'onboarding', 'setup'],
          sortOrder: 1
        },
        {
          title: 'Running Your First Payroll',
          description: 'Step-by-step guide to processing payroll using the guided wizard.',
          category: 'payroll' as const,
          difficulty: 'intermediate' as const,
          estimatedMinutes: 20,
          roleAccess: ['HR', 'Product Owner'],
          tags: ['payroll', 'wizard', 'processing'],
          sortOrder: 2
        },
        {
          title: 'Managing the Hiring Pipeline',
          description: 'Learn how to post jobs, review candidates, and manage the recruitment process.',
          category: 'hiring' as const,
          difficulty: 'intermediate' as const,
          estimatedMinutes: 15,
          roleAccess: ['HR', 'Manager', 'Product Owner'],
          tags: ['hiring', 'recruitment', 'candidates'],
          sortOrder: 3
        },
        {
          title: 'Using Studio AI for Recruitment',
          description: 'Discover how to leverage AI-powered insights for candidate screening and hiring decisions.',
          category: 'ai-features' as const,
          difficulty: 'advanced' as const,
          estimatedMinutes: 25,
          roleAccess: ['HR', 'Product Owner'],
          tags: ['ai', 'recruitment', 'automation'],
          sortOrder: 4
        }
      ];

      const createdTutorials = await db.insert(tutorials).values(tutorialData).returning();

      res.json({
        message: `Successfully seeded ${createdTutorials.length} tutorials`,
        tutorials: createdTutorials
      });
    } catch (error: any) {
      console.error('[Tutorials] Seed error:', error);
      res.status(500).json({ error: 'Failed to seed tutorials', details: error.message });
    }
  });
}
