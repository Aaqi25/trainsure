import { Response, NextFunction } from 'express';
import {
  ComplianceRequirementModel,
  UserModel,
  TrainingModel,
  CertificationModel,
  DepartmentModel,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import {
  evaluateEmployeeCompliance,
  evaluateAllEmployeesCompliance,
} from '../services/complianceService.ts';
import { logAudit } from '../services/auditService.ts';

export async function getComplianceRequirements(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const reqs = await ComplianceRequirementModel.find();
    const trainings = await TrainingModel.find();
    const certs = await CertificationModel.find();
    const depts = await DepartmentModel.find();

    const enriched = reqs.map(r => {
      const train = trainings.find(t => t._id === r.targetTrainingId);
      const cert = certs.find(c => c._id === r.targetCertificationId);
      const dept = depts.find(d => d._id === r.targetDepartmentId);
      return {
        ...r,
        targetTrainingTitle: train ? train.title : null,
        targetCertificationName: cert ? cert.name : null,
        targetDepartmentName: dept ? dept.name : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Compliance requirements retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createComplianceRequirement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      title,
      description,
      type,
      targetTrainingId,
      targetCertificationId,
      targetRole,
      targetDepartmentId,
      appliesToAll,
      frequency,
      gracePeriodDays,
    } = req.body;

    if (!title || !type) {
      throw new AppError('Title and requirement type are required', 400, 'VALIDATION_ERROR');
    }

    const created = await ComplianceRequirementModel.create({
      title,
      description: description || '',
      type,
      targetTrainingId: targetTrainingId || undefined,
      targetCertificationId: targetCertificationId || undefined,
      targetRole: targetRole || undefined,
      targetDepartmentId: targetDepartmentId || undefined,
      appliesToAll: Boolean(appliesToAll),
      frequency: frequency || 'ANNUAL',
      gracePeriodDays: Number(gracePeriodDays) || 14,
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_COMPLIANCE_REQUIREMENT',
      entity: 'ComplianceRequirement',
      entityId: created._id,
      details: { title: created.title, type: created.type },
    });

    res.status(201).json({
      success: true,
      message: 'Compliance requirement configured',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceOverview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let evaluations = await evaluateAllEmployeesCompliance();

    if (req.user?.role === 'MANAGER') {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      evaluations = evaluations.filter(e => teamIds.has(e.employeeId));
    }

    const total = evaluations.length;
    const compliant = evaluations.filter(e => e.overallStatus === 'COMPLIANT').length;
    const atRisk = evaluations.filter(e => e.overallStatus === 'AT_RISK').length;
    const nonCompliant = evaluations.filter(e => e.overallStatus === 'NON_COMPLIANT').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

    res.status(200).json({
      success: true,
      message: 'Compliance overview calculated',
      data: {
        summary: {
          totalEmployees: total,
          compliantCount: compliant,
          atRiskCount: atRisk,
          nonCompliantCount: nonCompliant,
          complianceRate,
        },
        evaluations,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAtRiskCompliance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let evaluations = await evaluateAllEmployeesCompliance();
    if (req.user?.role === 'MANAGER') {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      evaluations = evaluations.filter(e => teamIds.has(e.employeeId));
    }

    const atRisk = evaluations.filter(e => e.overallStatus === 'AT_RISK');
    res.status(200).json({
      success: true,
      message: 'At-risk employees retrieved',
      data: atRisk,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNonCompliantCompliance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let evaluations = await evaluateAllEmployeesCompliance();
    if (req.user?.role === 'MANAGER') {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      evaluations = evaluations.filter(e => teamIds.has(e.employeeId));
    }

    const nonCompliant = evaluations.filter(e => e.overallStatus === 'NON_COMPLIANT');
    res.status(200).json({
      success: true,
      message: 'Non-compliant employees retrieved',
      data: nonCompliant,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeCompliance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { employeeId } = req.params;
    const targetId = employeeId === 'my' ? req.user!._id : employeeId;

    const evaluation = await evaluateEmployeeCompliance(targetId);
    res.status(200).json({
      success: true,
      message: 'Employee compliance evaluation',
      data: evaluation,
    });
  } catch (err) {
    next(err);
  }
}
