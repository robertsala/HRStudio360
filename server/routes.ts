import type { Express } from 'express';
import { storage } from './storage.js';
import { insertProfileSchema, insertEmployeeSchema, insertLeaveRequestSchema } from '../shared/schema.js';

export function registerRoutes(app: Express) {
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
      const validated = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validated);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/profiles/:id', async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee routes
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

  // Stub authentication endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if profile exists
      let profile = await storage.getProfileByEmail(email);
      
      // Create demo profile if doesn't exist
      if (!profile) {
        profile = await storage.createProfile({
          email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
          department: 'IT'
        });
      }
      
      res.json({ user: profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  app.get('/api/auth/session', (req, res) => {
    // For now, return a mock session
    res.json({ user: null });
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
}
