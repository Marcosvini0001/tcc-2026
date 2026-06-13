import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerRequestId = req.get('X-Request-ID');
  req.requestId = headerRequestId || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
