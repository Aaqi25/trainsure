import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'trainsure-dev-only-jwt-secret');

if (!JWT_SECRET) {
  console.error('[TrainSure Auth] FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
  );
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
        error: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await UserModel.findById(decoded.id);
    if (!user || user.status === 'INACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated',
        error: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session',
      error: 'TOKEN_EXPIRED',
    });
  }
}

export function requireRole(...allowedRoles: Array<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}] role`,
        error: 'FORBIDDEN',
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireManagerOrAdmin = requireRole('ADMIN', 'MANAGER');
