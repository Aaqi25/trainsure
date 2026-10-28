import { Response, NextFunction } from 'express';
import {
  RoleModel,
  ProjectModel,
  SkillModel,
  UserModel,
  LearningResourceModel,
  IRole,
  IProject,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function getRoles(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const roles = await RoleModel.find();
    const skills = await SkillModel.find();

    const enriched = roles.map(r => ({
      ...r,
      requiredSkillsDetails: (r.requiredSkills || []).map(rs => {
        const s = skills.find(sk => sk._id === rs.skillId);
        return {
          skillId: rs.skillId,
          requiredProficiency: rs.requiredProficiency,
          name: s ? s.name : 'Unknown Skill',
          category: s ? s.category : 'General',
        };
      }),
    }));

    res.status(200).json({
      success: true,
      message: 'Roles retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, requiredSkills } = req.body;
    if (!name || !Array.isArray(requiredSkills)) {
      throw new AppError('Role name and required skills list are required', 400, 'VALIDATION_ERROR');
    }

    const created = await RoleModel.create({
      name,
      description: description || '',
      requiredSkills: requiredSkills.map((rs: any) => ({
        skillId: rs.skillId,
        requiredProficiency: Number(rs.requiredProficiency) || 50,
      })),
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_ROLE',
      entity: 'Role',
      entityId: created._id,
      details: { name: created.name, skillCount: created.requiredSkills.length },
    });

    res.status(201).json({
      success: true,
      message: 'Role benchmark created successfully',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let projects = await ProjectModel.find();
    const skills = await SkillModel.find();
    const users = await UserModel.find();

    if (req.user?.role === 'MANAGER') {
      // Show projects managed or visible to manager
    }

    const enriched = projects.map(p => {
      const manager = users.find(u => u._id === p.managerId);
      const team = users.filter(u => (p.assignedEmployeeIds || []).includes(u._id));
      return {
        ...p,
        manager: manager ? { _id: manager._id, name: manager.name, email: manager.email } : null,
        team: team.map(t => ({ _id: t._id, name: t.name, jobTitle: t.jobTitle })),
        requiredSkillsDetails: (p.requiredSkills || []).map(rs => {
          const s = skills.find(sk => sk._id === rs.skillId);
          return {
            skillId: rs.skillId,
            requiredProficiency: rs.requiredProficiency,
            name: s ? s.name : 'Unknown Skill',
            category: s ? s.category : 'General',
          };
        }),
      };
    });

    res.status(200).json({
      success: true,
      message: 'Projects retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, requiredSkills, assignedEmployeeIds, status } = req.body;
    if (!name) {
      throw new AppError('Project name is required', 400, 'VALIDATION_ERROR');
    }

    const created = await ProjectModel.create({
      name,
      description: description || '',
      managerId: req.user!._id,
      requiredSkills: (requiredSkills || []).map((rs: any) => ({
        skillId: rs.skillId,
        requiredProficiency: Number(rs.requiredProficiency) || 50,
      })),
      status: status || 'ACTIVE',
      assignedEmployeeIds: assignedEmployeeIds || [],
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: created._id,
      details: { name: created.name },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLearningResources(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const resources = await LearningResourceModel.find();
    const skills = await SkillModel.find();

    const enriched = resources.map(r => {
      const s = skills.find(sk => sk._id === r.skillId);
      return {
        ...r,
        skillName: s ? s.name : 'General Competency',
      };
    });

    res.status(200).json({
      success: true,
      message: 'Learning resources catalog retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createLearningResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, skillId, type, difficulty, duration, url, provider } = req.body;
    if (!title || !skillId) {
      throw new AppError('Title and skill ID are required', 400, 'VALIDATION_ERROR');
    }

    const created = await LearningResourceModel.create({
      title,
      description: description || '',
      skillId,
      type: type || 'COURSE',
      difficulty: difficulty || 'BEGINNER',
      duration: duration || '2 hours',
      url: url || 'https://trainsure.internal/learning',
      provider: provider || 'TrainSure Academy',
    });

    res.status(201).json({
      success: true,
      message: 'Learning resource added to catalog',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}
