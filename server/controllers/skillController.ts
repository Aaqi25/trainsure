import { Response, NextFunction } from 'express';
import {
  SkillModel,
  EmployeeSkillModel,
  EvidenceModel,
  UserModel,
  ISkill,
  IEmployeeSkill,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function getSkills(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const skills = await SkillModel.find();
    res.status(200).json({
      success: true,
      message: 'Skills catalog retrieved',
      data: skills,
    });
  } catch (err) {
    next(err);
  }
}

export async function createSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, category, description } = req.body;
    if (!name || !category) {
      throw new AppError('Skill name and category are required', 400, 'VALIDATION_ERROR');
    }

    const created = await SkillModel.create({
      name,
      category,
      description: description || '',
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_SKILL',
      entity: 'Skill',
      entityId: created._id,
      details: { name: created.name, category: created.category },
    });

    res.status(201).json({
      success: true,
      message: 'Skill added to catalog',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const targetId = id === 'my' ? req.user!._id : id;

    const empSkills = await EmployeeSkillModel.find({ employeeId: targetId });
    const catalog = await SkillModel.find();
    const evidenceList = await EvidenceModel.find({ employeeId: targetId });

    const enriched = empSkills.map(es => {
      const meta = catalog.find(c => c._id === es.skillId);
      const skillEvidence = evidenceList.filter(ev => ev.skillId === es.skillId);

      // Proficiency label: 0-20 Beginner, 21-40 Basic, 41-60 Intermediate, 61-80 Advanced, 81-100 Expert
      let levelLabel = 'Beginner';
      if (es.proficiency > 80) levelLabel = 'Expert';
      else if (es.proficiency > 60) levelLabel = 'Advanced';
      else if (es.proficiency > 40) levelLabel = 'Intermediate';
      else if (es.proficiency > 20) levelLabel = 'Basic';

      return {
        ...es,
        levelLabel,
        skill: meta || null,
        evidenceCount: skillEvidence.length,
        evidence: skillEvidence,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Employee skills retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function addEmployeeSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const targetId = id === 'my' ? req.user!._id : id;
    const { skillId, proficiency } = req.body;

    if (!skillId) {
      throw new AppError('Skill ID is required', 400, 'VALIDATION_ERROR');
    }

    const numProf = Math.min(100, Math.max(0, Number(proficiency) || 10));

    // Check if exists
    let existing = await EmployeeSkillModel.findOne({
      employeeId: targetId,
      skillId,
    });

    if (existing) {
      existing = await EmployeeSkillModel.findByIdAndUpdate(existing._id, {
        proficiency: numProf,
      });
      return res.status(200).json({
        success: true,
        message: 'Employee skill updated',
        data: existing,
      });
    }

    const created = await EmployeeSkillModel.create({
      employeeId: targetId,
      skillId,
      proficiency: numProf,
      evidenceIds: [],
      verified: req.user?.role !== 'EMPLOYEE',
      verifiedBy: req.user?.role !== 'EMPLOYEE' ? req.user?._id : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Skill added to employee profile',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id, skillId } = req.params;
    const targetId = id === 'my' ? req.user!._id : id;
    const { proficiency, verified } = req.body;

    const existing = await EmployeeSkillModel.findOne({
      employeeId: targetId,
      skillId,
    });

    if (!existing) {
      throw new AppError('Skill not found on employee profile', 404, 'NOT_FOUND');
    }

    const patch: Partial<IEmployeeSkill> = {};
    if (proficiency !== undefined) {
      patch.proficiency = Math.min(100, Math.max(0, Number(proficiency)));
    }
    if (verified !== undefined && req.user?.role !== 'EMPLOYEE') {
      patch.verified = Boolean(verified);
      patch.verifiedBy = req.user?._id;
      patch.verifiedAt = new Date().toISOString();
    }

    const updated = await EmployeeSkillModel.findByIdAndUpdate(existing._id, patch);

    res.status(200).json({
      success: true,
      message: 'Employee skill proficiency updated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
