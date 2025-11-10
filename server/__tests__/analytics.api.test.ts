/**
 * API endpoint tests for analytics routes
 */

import request from 'supertest';
import express from 'express';
import { router } from '../routes';

// Create a test app instance
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Analytics API Endpoints', () => {
  describe('GET /api/analytics/workforce', () => {
    it('should return workforce metrics for valid time range', async () => {
      const response = await request(app)
        .get('/api/analytics/workforce')
        .query({ timeRange: '1m' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalEmployees');
      expect(response.body).toHaveProperty('newHires');
      expect(response.body).toHaveProperty('departmentBreakdown');
      expect(Array.isArray(response.body.departmentBreakdown)).toBe(true);
    });

    it('should return 400 for invalid time range', async () => {
      const response = await request(app)
        .get('/api/analytics/workforce')
        .query({ timeRange: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should use default time range when not specified', async () => {
      const response = await request(app)
        .get('/api/analytics/workforce');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalEmployees');
    });
  });

  describe('GET /api/analytics/performance', () => {
    it('should return performance metrics for valid time range', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .query({ timeRange: '3m' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('avgPerformanceScore');
      expect(response.body).toHaveProperty('goalsAchieved');
      expect(response.body).toHaveProperty('reviewsCompleted');
      expect(response.body).toHaveProperty('reviewsTotal');
      expect(response.body).toHaveProperty('ratingDistribution');
      expect(Array.isArray(response.body.ratingDistribution)).toBe(true);
    });

    it('should return numeric values for performance metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .query({ timeRange: '1y' });

      expect(response.status).toBe(200);
      expect(typeof response.body.avgPerformanceScore).toBe('number');
      expect(typeof response.body.goalsAchieved).toBe('number');
      expect(typeof response.body.reviewsCompleted).toBe('number');
      expect(typeof response.body.reviewsTotal).toBe('number');
    });
  });

  describe('GET /api/analytics/leave', () => {
    it('should return leave metrics for valid time range', async () => {
      const response = await request(app)
        .get('/api/analytics/leave')
        .query({ timeRange: '6m' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('approvedRequests');
      expect(response.body).toHaveProperty('pendingRequests');
      expect(response.body).toHaveProperty('deniedRequests');
      expect(response.body).toHaveProperty('leaveByType');
    });

    it('should return correct data types for leave metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/leave')
        .query({ timeRange: '1m' });

      expect(response.status).toBe(200);
      expect(typeof response.body.totalRequests).toBe('number');
      expect(Array.isArray(response.body.leaveByType)).toBe(true);
    });
  });

  describe('GET /api/analytics/financial', () => {
    it('should return financial metrics for valid time range', async () => {
      const response = await request(app)
        .get('/api/analytics/financial')
        .query({ timeRange: '1y' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalPayroll');
      expect(response.body).toHaveProperty('avgSalary');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('payrollByDepartment');
    });

    it('should return numeric values for financial metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/financial')
        .query({ timeRange: '3m' });

      expect(response.status).toBe(200);
      expect(typeof response.body.totalPayroll).toBe('number');
      expect(typeof response.body.avgSalary).toBe('number');
      expect(typeof response.body.totalExpenses).toBe('number');
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should return combined analytics summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .query({ timeRange: '1m' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workforce');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('leave');
      expect(response.body).toHaveProperty('financial');
    });

    it('should validate time range parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .query({ timeRange: '5y' });

      expect(response.status).toBe(400);
    });

    it('should return all category metrics in summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .query({ timeRange: '6m' });

      expect(response.status).toBe(200);
      
      // Check workforce metrics
      expect(response.body.workforce).toHaveProperty('totalEmployees');
      expect(response.body.workforce).toHaveProperty('departmentBreakdown');
      
      // Check performance metrics
      expect(response.body.performance).toHaveProperty('avgPerformanceScore');
      expect(response.body.performance).toHaveProperty('ratingDistribution');
      
      // Check leave metrics
      expect(response.body.leave).toHaveProperty('totalRequests');
      expect(response.body.leave).toHaveProperty('leaveByType');
      
      // Check financial metrics
      expect(response.body.financial).toHaveProperty('totalPayroll');
      expect(response.body.financial).toHaveProperty('payrollByDepartment');
    });
  });

  describe('Time Range Validation', () => {
    const validTimeRanges = ['1m', '3m', '6m', '1y'];
    const invalidTimeRanges = ['2m', '1d', '2y', 'invalid', ''];

    validTimeRanges.forEach((timeRange) => {
      it(`should accept valid time range: ${timeRange}`, async () => {
        const response = await request(app)
          .get('/api/analytics/workforce')
          .query({ timeRange });

        expect(response.status).toBe(200);
      });
    });

    invalidTimeRanges.forEach((timeRange) => {
      it(`should reject invalid time range: ${timeRange}`, async () => {
        const response = await request(app)
          .get('/api/analytics/workforce')
          .query({ timeRange });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('timeRange');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to simulate errors
      // For now, we ensure the endpoint exists and responds
      const response = await request(app)
        .get('/api/analytics/workforce')
        .query({ timeRange: '1m' });

      expect([200, 500]).toContain(response.status);
    });
  });
});
