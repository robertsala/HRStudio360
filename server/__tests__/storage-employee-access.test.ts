import { MemStorage } from '../storage';

describe('Storage Layer - Employee Access Assignment Methods', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('assignEmployeeAccess', () => {
    it('should create new assignment with upsert logic', async () => {
      const assignment = {
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      };

      const result = await storage.assignEmployeeAccess(assignment);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe('emp-1');
      expect(result.accessLevelId).toBe('level-1');
      expect(result.assignedBy).toBe('user-1');
      expect(result.source).toBe('manual');
      expect(result.id).toBeDefined();
      expect(result.assignedAt).toBeDefined();
    });

    it('should update existing assignment (upsert)', async () => {
      // Create initial assignment
      const initial = await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      // Update same employee with different access level
      const updated = await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-2',  // Different level
        assignedBy: 'user-2',
        source: 'ai' as const,
        aiConfidence: 'high',
        aiReasoning: 'Senior role requires elevated access'
      });

      expect(updated.employeeId).toBe('emp-1');
      expect(updated.accessLevelId).toBe('level-2');
      expect(updated.assignedBy).toBe('user-2');
      expect(updated.source).toBe('ai');
      expect(updated.aiConfidence).toBe('high');
    });

    it('should handle AI-assigned access levels with confidence and reasoning', async () => {
      const aiAssignment = await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-3',
        assignedBy: 'system-ai',
        source: 'ai' as const,
        aiConfidence: 'high',
        aiReasoning: 'Based on department and role, user requires advanced permissions'
      });

      expect(aiAssignment.source).toBe('ai');
      expect(aiAssignment.aiConfidence).toBe('high');
      expect(aiAssignment.aiReasoning).toContain('advanced permissions');
    });
  });

  describe('bulkAssignEmployeeAccess', () => {
    it('should handle batch operations', async () => {
      const assignments = [
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'ai' as const },
        { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'ai' as const },
        { employeeId: 'emp-3', accessLevelId: 'level-1', source: 'ai' as const }
      ];

      await storage.bulkAssignEmployeeAccess(assignments, 'user-1');

      // Verify all were created
      const allAssignments = await storage.getEmployeeAccessAssignments();
      expect(allAssignments.length).toBe(3);
      
      const employeeIds = allAssignments.map(a => a.employeeId);
      expect(employeeIds).toContain('emp-1');
      expect(employeeIds).toContain('emp-2');
      expect(employeeIds).toContain('emp-3');
    });

    it('should set assignedBy for all bulk assignments', async () => {
      const assignments = [
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'migration' as const },
        { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'migration' as const }
      ];

      await storage.bulkAssignEmployeeAccess(assignments, 'migration-user');

      const allAssignments = await storage.getEmployeeAccessAssignments();
      allAssignments.forEach(assignment => {
        expect(assignment.assignedBy).toBe('migration-user');
      });
    });

    it('should handle empty assignments array', async () => {
      await storage.bulkAssignEmployeeAccess([], 'user-1');

      const allAssignments = await storage.getEmployeeAccessAssignments();
      expect(allAssignments.length).toBe(0);
    });

    it('should handle migration source correctly', async () => {
      const assignments = [
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'migration' as const },
      ];

      await storage.bulkAssignEmployeeAccess(assignments, 'migration-system');

      const allAssignments = await storage.getEmployeeAccessAssignments();
      expect(allAssignments[0].source).toBe('migration');
    });
  });

  describe('revokeEmployeeAccess', () => {
    it('should remove assignment', async () => {
      // Create assignment first
      await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      // Verify it exists
      let assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(1);

      // Revoke it
      await storage.revokeEmployeeAccess('emp-1', 'level-1');

      // Verify it's gone
      assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(0);
    });

    it('should only remove specific employee-level combination', async () => {
      // Create multiple assignments
      await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      await storage.assignEmployeeAccess({
        employeeId: 'emp-2',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      // Revoke only emp-1's assignment
      await storage.revokeEmployeeAccess('emp-1', 'level-1');

      // Verify emp-2's assignment still exists
      const assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(1);
      expect(assignments[0].employeeId).toBe('emp-2');
    });

    it('should handle non-existent assignment gracefully', async () => {
      // Attempt to revoke non-existent assignment
      await expect(
        storage.revokeEmployeeAccess('non-existent', 'level-1')
      ).resolves.not.toThrow();
    });
  });

  describe('getEmployeeAccessAssignments', () => {
    it('should fetch all assignments with proper structure', async () => {
      // Create test data
      await storage.bulkAssignEmployeeAccess([
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'manual' as const },
        { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'ai' as const, aiConfidence: 'high' }
      ], 'user-1');

      const assignments = await storage.getEmployeeAccessAssignments();

      expect(assignments.length).toBe(2);
      expect(assignments[0]).toHaveProperty('id');
      expect(assignments[0]).toHaveProperty('employeeId');
      expect(assignments[0]).toHaveProperty('accessLevelId');
      expect(assignments[0]).toHaveProperty('assignedBy');
      expect(assignments[0]).toHaveProperty('assignedAt');
      expect(assignments[0]).toHaveProperty('source');
    });

    it('should return empty array when no assignments exist', async () => {
      const assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments).toEqual([]);
    });

    it('should preserve all assignment metadata', async () => {
      await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'ai' as const,
        aiConfidence: 'medium',
        aiReasoning: 'Role-based recommendation'
      });

      const assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments[0].aiConfidence).toBe('medium');
      expect(assignments[0].aiReasoning).toBe('Role-based recommendation');
    });
  });

  describe('deleteEmployeeAccessAssignments', () => {
    it('should remove all assignments for employee', async () => {
      // Create multiple assignments for one employee
      await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      // Verify assignment exists
      let assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(1);

      // Delete all for emp-1
      await storage.deleteEmployeeAccessAssignments('emp-1');

      // Verify all removed
      assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(0);
    });

    it('should only affect specified employee', async () => {
      // Create assignments for multiple employees
      await storage.bulkAssignEmployeeAccess([
        { employeeId: 'emp-1', accessLevelId: 'level-1', source: 'manual' as const },
        { employeeId: 'emp-2', accessLevelId: 'level-2', source: 'manual' as const }
      ], 'user-1');

      // Delete emp-1's assignments
      await storage.deleteEmployeeAccessAssignments('emp-1');

      // Verify only emp-2 remains
      const assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(1);
      expect(assignments[0].employeeId).toBe('emp-2');
    });

    it('should handle non-existent employee gracefully', async () => {
      await expect(
        storage.deleteEmployeeAccessAssignments('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should support complete lifecycle: assign -> update -> revoke', async () => {
      // Assign
      const initial = await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-1',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      expect(initial.accessLevelId).toBe('level-1');

      // Update (via upsert)
      const updated = await storage.assignEmployeeAccess({
        employeeId: 'emp-1',
        accessLevelId: 'level-2',
        assignedBy: 'user-1',
        source: 'manual' as const,
        aiConfidence: null,
        aiReasoning: null
      });

      expect(updated.accessLevelId).toBe('level-2');

      let assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(1);  // Should still be 1 (updated, not duplicated)

      // Revoke
      await storage.revokeEmployeeAccess('emp-1', 'level-2');

      assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(0);
    });

    it('should handle mass operations efficiently', async () => {
      // Bulk assign 10 employees
      const bulkAssignments = Array.from({ length: 10 }, (_, i) => ({
        employeeId: `emp-${i}`,
        accessLevelId: `level-${i % 3 + 1}`,
        source: 'ai' as const
      }));

      await storage.bulkAssignEmployeeAccess(bulkAssignments, 'ai-system');

      let assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(10);

      // Delete half of them
      for (let i = 0; i < 5; i++) {
        await storage.deleteEmployeeAccessAssignments(`emp-${i}`);
      }

      assignments = await storage.getEmployeeAccessAssignments();
      expect(assignments.length).toBe(5);
    });
  });
});
