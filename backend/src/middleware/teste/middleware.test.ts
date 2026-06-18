import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../requestIdMiddleware';
import { requireAuth, requireAdmin } from '../authMiddleware';
import * as authService from '../../services/authService';

vi.mock('../../services/authService');

describe('Middleware', () => {
  describe('requestIdMiddleware', () => {
    it('should add unique requestId to request object', () => {
      const req = {
        get: vi.fn()
      } as unknown as Request & { requestId?: string };
      const res = {
        setHeader: vi.fn()
      } as unknown as Response;
      const next = vi.fn();

      requestIdMiddleware(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should generate different requestIds for different requests', () => {
      const req1 = { get: vi.fn() } as unknown as Request & { requestId?: string };
      const req2 = { get: vi.fn() } as unknown as Request & { requestId?: string };
      const res = { setHeader: vi.fn() } as unknown as Response;
      const next = vi.fn();

      requestIdMiddleware(req1, res, next);
      requestIdMiddleware(req2, res, next);

      expect(req1.requestId).not.toBe(req2.requestId);
    });
  });

  describe('requireAuth', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should allow authenticated requests', () => {
      (authService.verifyAccessToken as any).mockReturnValue({ userId: 1, role: 'user' });

      const req = {
        headers: { authorization: 'Bearer valid-token' }
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn();

      const middleware = requireAuth();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny requests without auth header', () => {
      const req = {
        headers: {}
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn();

      const middleware = requireAuth();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin role', () => {
      const req = {
        auth: { userId: 1, role: 'admin' }
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny non-admin role', () => {
      const req = {
        auth: { userId: 1, role: 'user' }
      } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const next = vi.fn();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

