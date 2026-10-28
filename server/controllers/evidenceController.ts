import { Response, NextFunction } from 'express';
import {
  EvidenceModel,
  EmployeeSkillModel,
  SkillModel,
  UserModel,
  IEvidence,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';
import { createNotification } from '../services/notificationService.ts';

export async function submitEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { skillId, type, title, description, score, employeeId } = req.body;

    const targetEmpId = req.user?.role !== 'EMPLOYEE' && employeeId ? employeeId : req.user!._id;

    if (!skillId || !type || !title) {
      throw new AppError('Skill, evidence type, and title are required', 400, 'VALIDATION_ERROR');
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const isDirectlyVerified = req.user?.role !== 'EMPLOYEE';

    const evidence = await EvidenceModel.create({
      employeeId: targetEmpId,
      skillId,
      type,
      title,
      description: description || '',
      score: score !== undefined ? Number(score) : undefined,
      fileUrl,
      fileName,
      verified: isDirectlyVerified,
      verifiedBy: isDirectlyVerified ? req.user?._id : undefined,
      verifiedAt: isDirectlyVerified ? new Date().toISOString() : undefined,
    });

    // Ensure employee has this skill in their profile
    let empSkill = await EmployeeSkillModel.findOne({
      employeeId: targetEmpId,
      skillId,
    });

    if (empSkill) {
      const evidenceIds = [...(empSkill.evidenceIds || []), evidence._id];
      const newProf = isDirectlyVerified
        ? Math.min(100, empSkill.proficiency + 10)
        : empSkill.proficiency;
      await EmployeeSkillModel.findByIdAndUpdate(empSkill._id, {
        evidenceIds,
        proficiency: newProf,
        verified: isDirectlyVerified ? true : empSkill.verified,
      });
    } else {
      await EmployeeSkillModel.create({
        employeeId: targetEmpId,
        skillId,
        proficiency: isDirectlyVerified ? 50 : 25,
        evidenceIds: [evidence._id],
        verified: isDirectlyVerified,
        verifiedBy: isDirectlyVerified ? req.user?._id : undefined,
      });
    }

    // If submitted by employee, notify their manager
    if (req.user?.role === 'EMPLOYEE' && req.user.managerId) {
      await createNotification({
        recipientId: req.user.managerId,
        type: 'EVIDENCE_VERIFICATION',
        title: `Evidence Submitted for Review: ${title}`,
        message: `${req.user.name} submitted new skill evidence for review.`,
        link: '/manager/skills',
      });
    }

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'SUBMIT_EVIDENCE',
      entity: 'Evidence',
      entityId: evidence._id,
      details: { title, type, skillId },
    });

    res.status(201).json({
      success: true,
      message: 'Evidence submitted successfully',
      data: evidence,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, skillId, verified } = req.query;

    let list = await EvidenceModel.find();

    if (req.user?.role === 'MANAGER' && !employeeId) {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      list = list.filter(e => teamIds.has(e.employeeId));
    }

    if (employeeId) {
      list = list.filter(e => e.employeeId === String(employeeId));
    }
    if (skillId) {
      list = list.filter(e => e.skillId === String(skillId));
    }
    if (verified !== undefined) {
      list = list.filter(e => String(e.verified) === String(verified));
    }

    const users = await UserModel.find();
    const skills = await SkillModel.find();

    const enriched = list.map(e => {
      const emp = users.find(u => u._id === e.employeeId);
      const skill = skills.find(s => s._id === e.skillId);
      const verifier = e.verifiedBy ? users.find(u => u._id === e.verifiedBy) : null;
      return {
        ...e,
        employee: emp ? { _id: emp._id, name: emp.name, email: emp.email } : null,
        skill: skill ? { _id: skill._id, name: skill.name, category: skill.category } : null,
        verifiedByUser: verifier ? { _id: verifier._id, name: verifier.name } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Evidence records retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!._id;
    const list = await EvidenceModel.find({ employeeId });
    const skills = await SkillModel.find();

    const enriched = list.map(e => {
      const skill = skills.find(s => s._id === e.skillId);
      return {
        ...e,
        skill: skill ? { _id: skill._id, name: skill.name, category: skill.category } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'My evidence records',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { verified, proficiencyBoost } = req.body;

    const evidence = await EvidenceModel.findById(id);
    if (!evidence) {
      throw new AppError('Evidence not found', 404, 'NOT_FOUND');
    }

    const updated = await EvidenceModel.findByIdAndUpdate(id, {
      verified: Boolean(verified),
      verifiedBy: req.user!._id,
      verifiedAt: new Date().toISOString(),
    });

    // If verified, boost employee skill proficiency and mark skill verified
    if (verified) {
      const empSkill = await EmployeeSkillModel.findOne({
        employeeId: evidence.employeeId,
        skillId: evidence.skillId,
      });

      const boost = Number(proficiencyBoost) || 15;
      if (empSkill) {
        const newProf = Math.min(100, empSkill.proficiency + boost);
        await EmployeeSkillModel.findByIdAndUpdate(empSkill._id, {
          proficiency: newProf,
          verified: true,
          verifiedBy: req.user!._id,
          verifiedAt: new Date().toISOString(),
        });
      }

      await createNotification({
        recipientId: evidence.employeeId,
        type: 'EVIDENCE_VERIFICATION',
        title: `Evidence Verified: ${evidence.title}`,
        message: `${req.user!.name} verified your skill evidence. Your proficiency was updated.`,
        link: '/skills',
      });
    }

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: verified ? 'VERIFY_EVIDENCE' : 'UNVERIFY_EVIDENCE',
      entity: 'Evidence',
      entityId: id,
    });

    res.status(200).json({
      success: true,
      message: `Evidence ${verified ? 'verified' : 'unverified'} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
