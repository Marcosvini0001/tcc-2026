import { describe, expect, it } from 'vitest';
import userRoutes from '../userRoutes';
import admRoutes from '../admRoutes';

describe('Routes', () => {
  describe('User Routes', () => {
    it('should define routes in userRoutes', () => {
      expect(userRoutes).toBeDefined();
      expect(userRoutes.stack).toBeDefined();
    });

    it('should have routes for POST /login', () => {
      const loginRoute = userRoutes.stack.find((route: any) =>
        route.route && route.route.path === '/login' && route.route.methods.post
      );
      expect(loginRoute).toBeDefined();
    });

    it('should have routes for POST / (register)', () => {
      const registerRoute = userRoutes.stack.find((route: any) =>
        route.route && route.route.path === '/' && route.route.methods.post
      );
      expect(registerRoute).toBeDefined();
    });

    it('should have routes for password reset', () => {
      const resetRoute = userRoutes.stack.find((route: any) =>
        route.route && route.route.path === '/reset-password' && route.route.methods.post
      );
      expect(resetRoute).toBeDefined();
    });

    it('should have routes for friend management', () => {
      const friendRoutes = userRoutes.stack.filter((route: any) =>
        route.route && route.route.path?.includes('/friends')
      );
      expect(friendRoutes.length).toBeGreaterThan(0);
    });

    it('should have routes for task management', () => {
      const taskRoutes = userRoutes.stack.filter((route: any) =>
        route.route && route.route.path?.includes('/tasks')
      );
      expect(taskRoutes.length).toBeGreaterThan(0);
    });
  });

  describe('Admin Routes', () => {
    it('should define routes in admRoutes', () => {
      expect(admRoutes).toBeDefined();
      expect(admRoutes.stack).toBeDefined();
    });

    it('should have routes for admin login', () => {
      const loginRoute = admRoutes.stack.find((route: any) =>
        route.route && route.route.path === '/login' && route.route.methods.post
      );
      expect(loginRoute).toBeDefined();
    });

    it('should have routes for admin CRUD', () => {
      const crudRoutes = admRoutes.stack.filter((route: any) =>
        route.route && (route.route.methods.post || route.route.methods.get || route.route.methods.put || route.route.methods.delete)
      );
      expect(crudRoutes.length).toBeGreaterThan(0);
    });
  });
});
