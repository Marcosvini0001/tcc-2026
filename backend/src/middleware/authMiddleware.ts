import { NextFunction, Request, Response } from 'express';
import { AuthRole, verifyAccessToken } from '../services/authService';

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token.trim();
};

export const requireAuth = (allowedRoles?: AuthRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const auth = verifyAccessToken(token);

      if (allowedRoles && !allowedRoles.includes(auth.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.auth = auth;
      return next();
    } catch (_error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth || req.auth.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

export const requireUserAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requestedUserId = Number(req.params.id);
  if (Number.isNaN(requestedUserId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  if (req.auth.role === 'admin' || req.auth.userId === requestedUserId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden' });
};