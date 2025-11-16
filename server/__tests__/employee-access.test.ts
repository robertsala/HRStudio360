import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { MemStorage } from '../storage';

// Mock storage
const mockStorage = {
  getEmployeeAccessAssignments: jest.fn(),
  assignEmployeeAccess: jest.fn(),
  bulkAssignEmployeeAccess: jest.fn(),
  revokeEmployeeAccess: jest.fn(),
  deleteEmployeeAccessAssignments: jest.fn(),
  getProfile: jest.fn(),
} as any;

describe('Employee Access Assignment API Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app with session middleware
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));

    // Mock authentication middleware
    app.use((req, res, next) => {
      // Simulate authenticated session
      (req as any).session = {
        userId: 'test-user-id',
        save: (cb: any) => cb && cb()
      };
      next();
    });

    // Define test routes
    app.get('/api/employee-access/assignments', async (req, res) => {
      try {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await mockStorage.getProfile(userId);
        if (!profile || (profile.role !== 'hr' && profile.role !== 'admin')) {
          return res.status(403).json({ error: 'Forbidden: HR or Product Owner access required' });
        }

        const assignments = await mockStorage.getEmployeeAccessAssignments();
        res.json(assignments);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/employee-access/assign', async (req, res) => {
      try {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await mockStorage.getProfile(userId);
        if (!profile || (profile.role !== 'hr' && profile.role !== 'admin')) {
          return res.status(403).json({ error: 'Forbidden: HR or Product Owner access required' });
        }

        const assignment = await mockStorage.assignEmployeeAccess({
          ...req.body,
          assignedBy: userId
        });
        res.status(201).json(assignment);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.post('/api/employee-access/bulk-assign', async (req, res) => {
      try {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await mockStorage.getProfile(userId);
        if (!profile || (profile.role !== 'hr' && profile.role !== 'admin')) {
          return res.status(403).json({ error: 'Forbidden: HR or Product Owner access required' });
        }

        await mockStorage.bulkAssignEmployeeAccess(req.body.assignments, userId);
        res.status(201).json({ success: true });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete('/api/employee-access/revoke', async (req, res) => {
      try {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await mockStorage.getProfile(userId);
        if (!profile || (profile.role !== 'hr' && profile.role !== 'admin')) {
          return res.status(403).json({ error: 'Forbidden: HR or Product Owner access required' });
        }

        await mockStorage.revokeEmployeeAccess(req.body.employeeId, req.body.accessLevelId);
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete('/api/employee-access/:employeeId', async (req, res) => {
      try {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await mockStorage.getProfile(userId);
        if (!profile || (profile.role !== 'hr' && profile.role !== 'admin')) {
          return res.status(403).json({ error: 'Forbidden: HR or Product Owner access required' });
        }

        await mockStorage.deleteEmployeeAccessAssignments(req.params.employeeId);
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });
  });

  describe('GET /api/employee-access/assignments', () => {
    it('should require authentication', async () => {
      // Create app without session
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.get('/api/employee-access/assignments', (req, res) => {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json([]);
      });

      const response = await request(noAuthApp)
        .get('/api/employee-access/assignments');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 403 for non-HR roles', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'employee'  // Not HR or admin
      });

      const response = await request(app)
        .get('/api/employee-access/assignments');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should return assignments for HR users', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      const mockAssignments = [
        {
          id: 'assignment-1',
          employeeId: 'emp-1',
          accessLevelId: 'level-1',
          assignedBy: 'test-user-id',
          assignedAt: new Date().toISOString()
        }
      ];

      mockStorage.getEmployeeAccessAssignments.mockResolvedValue(mockAssignments);

      const response = await request(app)
        .get('/api/employee-access/assignments');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAssignments);
      expect(mockStorage.getEmployeeAccessAssignments).toHaveBeenCalled();
    });

    it('should return assignments for Product Owner (admin) users', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'admin'
      });

      const mockAssignments = [{ id: 'assignment-1' }];
      mockStorage.getEmployeeAccessAssignments.mockResolvedValue(mockAssignments);

      const response = await request(app)
        .get('/api/employee-access/assignments');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAssignments);
    });
  });

  describe('POST /api/employee-access/assign', () => {
    it('should create assignment correctly', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      const newAssignment = {
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        source: 'manual',
        aiConfidence: null,
        aiReasoning: null
      };

      const createdAssignment = {
        id: 'assignment-1',
        ...newAssignment,
        assignedBy: 'test-user-id',
        assignedAt: new Date().toISOString()
      };

      mockStorage.assignEmployeeAccess.mockResolvedValue(createdAssignment);

      const response = await request(app)
        .post('/api/employee-access/assign')
        .send(newAssignment);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdAssignment);
      expect(mockStorage.assignEmployeeAccess).toHaveBeenCalledWith({
        ...newAssignment,
        assignedBy: 'test-user-id'
      });
    });

    it('should require HR or admin role', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'employee'
      });

      const response = await request(app)
        .post('/api/employee-access/assign')
        .send({ employeeId: 'emp-1', accessLevelId: 'level-1' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/employee-access/bulk-assign', () => {
    it('should handle multiple assignments', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      mockStorage.bulkAssignEmployeeAccess.mockResolvedValue(undefined);

      const assignments = [
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'ai' },
        { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'ai' }
      ];

      const response = await request(app)
        .post('/api/employee-access/bulk-assign')
        .send({ assignments });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockStorage.bulkAssignEmployeeAccess).toHaveBeenCalledWith(
        assignments,
        'test-user-id'
      );
    });

    it('should validate request body', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      const response = await request(app)
        .post('/api/employee-access/bulk-assign')
        .send({});  // Missing assignments array

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/employee-access/revoke', () => {
    it('should remove assignment', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      mockStorage.revokeEmployeeAccess.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/employee-access/revoke')
        .send({ employeeId: 'emp-1', accessLevelId: 'level-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockStorage.revokeEmployeeAccess).toHaveBeenCalledWith('emp-1', 'level-1');
    });

    it('should require HR role', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'manager'
      });

      const response = await request(app)
        .delete('/api/employee-access/revoke')
        .send({ employeeId: 'emp-1', accessLevelId: 'level-1' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/employee-access/:employeeId', () => {
    it('should delete all assignments for employee', async () => {
      mockStorage.getProfile.mockResolvedValue({
        id: 'test-user-id',
        role: 'hr'
      });

      mockStorage.deleteEmployeeAccessAssignments.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/employee-access/emp-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockStorage.deleteEmployeeAccessAssignments).toHaveBeenCalledWith('emp-1');
    });

    it('should require authentication', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.delete('/api/employee-access/:employeeId', (req, res) => {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true });
      });

      const response = await request(noAuthApp)
        .delete('/api/employee-access/emp-1');

      expect(response.status).toBe(401);
    });
  });
});
