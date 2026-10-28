import { Response, NextFunction } from 'express';
import { DepartmentModel, UserModel, IDepartment } from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function getDepartments(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const departments = await DepartmentModel.find();
    const users = await UserModel.find();

    const enriched = departments.map(d => {
      const deptUsers = users.filter(u => u.departmentId === d._id);
      const manager = users.find(u => u._id === d.managerId);
      return {
        ...d,
        employeeCount: deptUsers.length,
        manager: manager ? { _id: manager._id, name: manager.name, email: manager.email } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const dept = await DepartmentModel.findById(id);
    if (!dept) {
      throw new AppError('Department not found', 404, 'NOT_FOUND');
    }

    const users = await UserModel.find({ departmentId: id });
    const manager = dept.managerId ? await UserModel.findById(dept.managerId) : null;

    res.status(200).json({
      success: true,
      message: 'Department details retrieved',
      data: {
        ...dept,
        employeeCount: users.length,
        manager: manager ? { _id: manager._id, name: manager.name, email: manager.email } : null,
        members: users.map(u => ({
          _id: u._id,
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          jobTitle: u.jobTitle,
          role: u.role,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, managerId } = req.body;
    if (!name) {
      throw new AppError('Department name is required', 400, 'VALIDATION_ERROR');
    }

    const dept = await DepartmentModel.create({
      name,
      description: description || '',
      managerId: managerId || undefined,
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: dept._id,
      details: { name: dept.name },
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: dept,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, description, managerId } = req.body;

    const existing = await DepartmentModel.findById(id);
    if (!existing) {
      throw new AppError('Department not found', 404, 'NOT_FOUND');
    }

    const updated = await DepartmentModel.findByIdAndUpdate(id, {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      managerId: managerId !== undefined ? managerId : existing.managerId,
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await DepartmentModel.findById(id);
    if (!existing) {
      throw new AppError('Department not found', 404, 'NOT_FOUND');
    }

    // Check if employees belong to this department
    const count = await UserModel.countDocuments({ departmentId: id });
    if (count > 0) {
      throw new AppError(
        `Cannot delete department because ${count} employee(s) are assigned to it. Reassign employees first.`,
        409,
        'DEPARTMENT_NOT_EMPTY'
      );
    }

    await DepartmentModel.findByIdAndDelete(id);

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'DELETE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      details: { name: existing.name },
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
