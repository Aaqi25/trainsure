import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/index.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, departmentId, jobTitle } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400, 'MISSING_FIELDS');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Please enter a valid email address', 422, 'INVALID_EMAIL');
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 422, 'WEAK_PASSWORD');
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const count = await UserModel.countDocuments();
    const employeeId = `EMP-${1000 + count + 1}`;

    const user = await UserModel.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role && ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE',
      departmentId: departmentId || undefined,
      jobTitle: jobTitle || 'Team Member',
      status: 'ACTIVE',
    });

    const token = generateToken(user);

    await logAudit({
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id,
    });

    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('This user account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated', 401, 'UNAUTHORIZED');
    }
    const { passwordHash: _, ...safeUser } = req.user;
    res.status(200).json({
      success: true,
      message: 'Current authenticated profile retrieved',
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDemoUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && process.env.ENABLE_DEMO_SWITCH !== 'true') {
      return res.status(200).json({
        success: true,
        message: 'Demo accounts are disabled in production mode.',
        data: [],
      });
    }

    const users = await UserModel.find({ status: 'ACTIVE' });
    const safeList = users.map(u => {
      const { passwordHash: _, ...rest } = u;
      return rest;
    });
    res.status(200).json({
      success: true,
      message: 'Available demo users retrieved',
      data: safeList,
    });
  } catch (err) {
    next(err);
  }
}

export async function switchDemoUser(req: Request, res: Response, next: NextFunction) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && process.env.ENABLE_DEMO_SWITCH !== 'true') {
      throw new AppError(
        'Demo persona switching is disabled in production environments. Please log in with valid credentials.',
        403,
        'DEMO_SWITCH_DISABLED'
      );
    }

    const { userId } = req.body;
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: `Switched session to ${user.name} (${user.role})`,
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
}
