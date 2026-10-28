import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, DepartmentModel, IUser } from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { departmentId, role, status, search, managerId } = req.query;

    let users = await UserModel.find();

    // If Manager and not Admin, limit to team or department unless querying all employees for assignments
    if (req.user?.role === 'MANAGER' && req.query.teamOnly === 'true') {
      users = users.filter(u => u.managerId === req.user?._id || u.departmentId === req.user?.departmentId);
    }

    if (departmentId) {
      users = users.filter(u => u.departmentId === String(departmentId));
    }
    if (role) {
      users = users.filter(u => u.role === String(role));
    }
    if (status) {
      users = users.filter(u => u.status === String(status));
    }
    if (managerId) {
      users = users.filter(u => u.managerId === String(managerId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          u.jobTitle.toLowerCase().includes(q)
      );
    }

    // Populate department and manager info
    const departments = await DepartmentModel.find();
    const allUsers = await UserModel.find();

    const enriched = users.map(u => {
      const { passwordHash: _, ...safe } = u;
      const dept = departments.find(d => d._id === u.departmentId);
      const mgr = allUsers.find(m => m._id === u.managerId);
      return {
        ...safe,
        department: dept ? { _id: dept._id, name: dept.name } : null,
        manager: mgr ? { _id: mgr._id, name: mgr.name, email: mgr.email } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const { passwordHash: _, ...safe } = user;
    const dept = user.departmentId ? await DepartmentModel.findById(user.departmentId) : null;
    const mgr = user.managerId ? await UserModel.findById(user.managerId) : null;

    res.status(200).json({
      success: true,
      message: 'User details retrieved',
      data: {
        ...safe,
        department: dept ? { _id: dept._id, name: dept.name } : null,
        manager: mgr ? { _id: mgr._id, name: mgr.name, email: mgr.email } : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, departmentId, managerId, jobTitle, phone } = req.body;

    if (!name || !email || !jobTitle) {
      throw new AppError('Name, email, and job title are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const defaultPassword = password || 'TrainSure2026!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const count = await UserModel.countDocuments();
    const employeeId = `EMP-${1000 + count + 1}`;

    const created = await UserModel.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'EMPLOYEE',
      departmentId: departmentId || undefined,
      managerId: managerId || undefined,
      jobTitle,
      phone: phone || undefined,
      status: 'ACTIVE',
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: created._id,
      details: { name: created.name, email: created.email, role: created.role },
    });

    const { passwordHash: _, ...safe } = created;
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safe,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, managerId, jobTitle, phone, status } = req.body;

    const existing = await UserModel.findById(id);
    if (!existing) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Role check: Only ADMIN can change role or department
    if (role && role !== existing.role && req.user?.role !== 'ADMIN') {
      throw new AppError('Only administrators can change user roles', 403, 'FORBIDDEN');
    }

    const updateData: Partial<IUser> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role && req.user?.role === 'ADMIN') updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (status && req.user?.role === 'ADMIN') updateData.status = status;

    const updated = await UserModel.findByIdAndUpdate(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update user', 500, 'UPDATE_FAILED');
    }

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: updateData,
    });

    const { passwordHash: _, ...safe } = updated;
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safe,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Soft delete / deactivation
    await UserModel.findByIdAndUpdate(id, { status: 'INACTIVE' });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: id,
      details: { name: user.name, email: user.email },
    });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
