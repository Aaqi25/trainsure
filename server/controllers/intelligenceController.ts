import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { calculateReadiness } from '../services/readinessService.ts';
import { getLearningRecommendationsForEmployee } from '../services/recommendationService.ts';
import {
  calculateEmployeeRisk,
  calculateAllEmployeesRisk,
} from '../services/riskService.ts';
import { UserModel, RoleModel, ProjectModel } from '../models/index.ts';
import { AppError } from '../middleware/error.ts';

export async function getSkillGaps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, roleId, projectId } = req.params;
    const targetEmpId = employeeId === 'my' ? req.user!._id : employeeId;

    const targetType = roleId ? 'ROLE' : 'PROJECT';
    const targetId = roleId || projectId;

    if (!targetId) {
      throw new AppError('Role ID or Project ID required', 400, 'VALIDATION_ERROR');
    }

    const readiness = await calculateReadiness(targetEmpId, targetType, targetId);

    res.status(200).json({
      success: true,
      message: 'Skill gap analysis completed',
      data: {
        employeeId: readiness.employeeId,
        employeeName: readiness.employeeName,
        targetType: readiness.targetType,
        targetName: readiness.targetName,
        readinessPercentage: readiness.readinessPercentage,
        matchedSkills: readiness.matchedSkills,
        gapSkills: readiness.gapSkills,
        missingSkills: readiness.missingSkills,
        recommendationSummary: readiness.recommendationSummary,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, roleId, projectId } = req.params;
    const targetEmpId = employeeId === 'my' ? req.user!._id : employeeId;

    const targetType = roleId ? 'ROLE' : 'PROJECT';
    const targetId = roleId || projectId;

    if (!targetId) {
      throw new AppError('Role ID or Project ID required', 400, 'VALIDATION_ERROR');
    }

    const readiness = await calculateReadiness(targetEmpId, targetType, targetId);

    res.status(200).json({
      success: true,
      message: 'Readiness evaluation calculated',
      data: readiness,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    const targetEmpId = !employeeId || employeeId === 'my' ? req.user!._id : employeeId;

    const result = await getLearningRecommendationsForEmployee(targetEmpId);

    res.status(200).json({
      success: true,
      message: 'Learning recommendations generated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRiskAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    const targetEmpId = !employeeId || employeeId === 'my' ? req.user!._id : employeeId;

    const risk = await calculateEmployeeRisk(targetEmpId);

    res.status(200).json({
      success: true,
      message: 'Compliance risk intelligence evaluated',
      data: risk,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllEmployeesRisk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let risks = await calculateAllEmployeesRisk();

    if (req.user?.role === 'MANAGER') {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      risks = risks.filter(r => teamIds.has(r.employeeId));
    }

    const high = risks.filter(r => r.riskLevel === 'HIGH').length;
    const medium = risks.filter(r => r.riskLevel === 'MEDIUM').length;
    const low = risks.filter(r => r.riskLevel === 'LOW').length;

    res.status(200).json({
      success: true,
      message: 'Workforce compliance risk intelligence overview',
      data: {
        summary: {
          total: risks.length,
          highRiskCount: high,
          mediumRiskCount: medium,
          lowRiskCount: low,
        },
        risks,
      },
    });
  } catch (err) {
    next(err);
  }
}
