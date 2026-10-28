import { Response, NextFunction } from 'express';
import {
  TrainingAssignmentModel,
  TrainingModel,
  UserModel,
  EvidenceModel,
  SkillModel,
  AssessmentModel,
  ITrainingAssignment,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';
import { createNotification } from '../services/notificationService.ts';

export async function createAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, employeeIds, departmentId, trainingId, dueDate, priority } = req.body;

    if (!trainingId || !dueDate) {
      throw new AppError('Training ID and due date are required', 400, 'VALIDATION_ERROR');
    }

    const training = await TrainingModel.findById(trainingId);
    if (!training) {
      throw new AppError('Training course not found', 404, 'NOT_FOUND');
    }

    let targetEmployeeIds: string[] = [];

    if (employeeId) {
      targetEmployeeIds.push(employeeId);
    } else if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (departmentId) {
      const deptEmployees = await UserModel.find({ departmentId, role: 'EMPLOYEE', status: 'ACTIVE' });
      targetEmployeeIds = deptEmployees.map(e => e._id);
    } else {
      throw new AppError('Please select at least one employee or department', 400, 'NO_TARGET_SPECIFIED');
    }

    const createdAssignments: ITrainingAssignment[] = [];
    const now = new Date().toISOString();

    for (const empId of targetEmployeeIds) {
      // Check if already assigned and active
      const existing = await TrainingAssignmentModel.findOne({
        employeeId: empId,
        trainingId,
      });

      if (existing && existing.status !== 'COMPLETED') {
        continue; // skip duplicate assignment
      }

      const assignment = await TrainingAssignmentModel.create({
        employeeId: empId,
        trainingId,
        assignedBy: req.user!._id,
        assignedDate: now,
        dueDate,
        priority: priority || 'MEDIUM',
        status: 'ASSIGNED',
        progress: 0,
        completedModules: [],
      });

      createdAssignments.push(assignment);

      // Create notification
      await createNotification({
        recipientId: empId,
        type: 'TRAINING_ASSIGNED',
        title: `Assigned: ${training.title}`,
        message: `You have been assigned "${training.title}" due by ${new Date(dueDate).toLocaleDateString()}.`,
        link: '/training',
      });
    }

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ASSIGN_TRAINING',
      entity: 'TrainingAssignment',
      entityId: trainingId,
      details: {
        trainingTitle: training.title,
        recipientsCount: createdAssignments.length,
        dueDate,
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully assigned training to ${createdAssignments.length} employee(s)`,
      data: createdAssignments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { employeeId, trainingId, status, departmentId } = req.query;

    let assignments = await TrainingAssignmentModel.find();

    // If Manager querying, filter by team members unless specific employee is requested
    if (req.user?.role === 'MANAGER') {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      if (!employeeId) {
        assignments = assignments.filter(a => teamIds.has(a.employeeId));
      }
    }

    if (employeeId) {
      assignments = assignments.filter(a => a.employeeId === String(employeeId));
    }
    if (trainingId) {
      assignments = assignments.filter(a => a.trainingId === String(trainingId));
    }
    if (status) {
      assignments = assignments.filter(a => a.status === String(status));
    }

    const users = await UserModel.find();
    const trainings = await TrainingModel.find();

    let enriched = assignments.map(a => {
      const emp = users.find(u => u._id === a.employeeId);
      const assigner = users.find(u => u._id === a.assignedBy);
      const train = trainings.find(t => t._id === a.trainingId);

      // Check overdue dynamically
      const isPastDue = new Date(a.dueDate) < new Date() && a.status !== 'COMPLETED';
      const effectiveStatus = isPastDue ? 'OVERDUE' : a.status;

      return {
        ...a,
        status: effectiveStatus,
        employee: emp ? { _id: emp._id, name: emp.name, email: emp.email, departmentId: emp.departmentId } : null,
        assignedByUser: assigner ? { _id: assigner._id, name: assigner.name } : null,
        training: train ? { _id: train._id, title: train.title, category: train.category, difficulty: train.difficulty, duration: train.duration } : null,
      };
    });

    if (departmentId) {
      enriched = enriched.filter(e => e.employee?.departmentId === String(departmentId));
    }

    res.status(200).json({
      success: true,
      message: 'Assignments retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!._id;
    const assignments = await TrainingAssignmentModel.find({ employeeId });
    const trainings = await TrainingModel.find();
    const assessments = await AssessmentModel.find();

    const enriched = assignments.map(a => {
      const train = trainings.find(t => t._id === a.trainingId);
      const assess = assessments.find(as => as.trainingId === a.trainingId);

      const isPastDue = new Date(a.dueDate) < new Date() && a.status !== 'COMPLETED';
      const effectiveStatus = isPastDue ? 'OVERDUE' : a.status;

      return {
        ...a,
        status: effectiveStatus,
        training: train || null,
        assessment: assess
          ? {
              _id: assess._id,
              title: assess.title,
              passingScore: assess.passingScore,
              timeLimit: assess.timeLimit,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'My training assignments retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { assignmentId } = req.params;
    const { moduleId, markCompleted } = req.body;

    const assignment = await TrainingAssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Assignment not found', 404, 'NOT_FOUND');
    }

    // Must be assigned employee or manager/admin
    if (req.user?.role === 'EMPLOYEE' && assignment.employeeId !== req.user._id) {
      throw new AppError('Unauthorized to update this assignment', 403, 'FORBIDDEN');
    }

    const training = await TrainingModel.findById(assignment.trainingId);
    if (!training) {
      throw new AppError('Training course not found', 404, 'NOT_FOUND');
    }

    const totalModules = (training.modules || []).length;
    let completedModules = [...(assignment.completedModules || [])];

    if (markCompleted && !completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    } else if (markCompleted === false) {
      completedModules = completedModules.filter(id => id !== moduleId);
    }

    const progress = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 100;

    let newStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' = 'ASSIGNED';
    let completedAt = assignment.completedAt;

    if (progress === 100) {
      newStatus = 'COMPLETED';
      completedAt = new Date().toISOString();

      // Automatically create training evidence for employee's portfolio!
      // Look up matching skill category or name
      const skills = await SkillModel.find();
      const matchedSkill = skills.find(
        s =>
          s.name.toLowerCase() === training.title.toLowerCase() ||
          s.category.toLowerCase() === training.category.toLowerCase()
      ) || skills[0];

      if (matchedSkill) {
        await EvidenceModel.create({
          employeeId: assignment.employeeId,
          skillId: matchedSkill._id,
          type: 'TRAINING',
          title: `Completed Training: ${training.title}`,
          description: `Successfully completed all ${totalModules} module(s) of ${training.title}.`,
          score: 100,
          verified: true,
          verifiedBy: req.user!._id,
          verifiedAt: new Date().toISOString(),
        });
      }
    } else if (progress > 0) {
      newStatus = 'IN_PROGRESS';
    } else {
      newStatus = 'ASSIGNED';
    }

    // Check overdue
    if (newStatus !== 'COMPLETED' && new Date(assignment.dueDate) < new Date()) {
      newStatus = 'OVERDUE';
    }

    const updated = await TrainingAssignmentModel.findByIdAndUpdate(assignmentId, {
      completedModules,
      progress,
      status: newStatus,
      completedAt,
    });

    res.status(200).json({
      success: true,
      message: 'Training progress updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!._id;
    const assignments = await TrainingAssignmentModel.find({ employeeId });

    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'COMPLETED').length;
    const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS').length;
    const overdue = assignments.filter(a => a.status === 'OVERDUE' || (a.status !== 'COMPLETED' && new Date(a.dueDate) < new Date())).length;
    const assigned = total - completed - inProgress;

    const avgProgress = total > 0 ? Math.round(assignments.reduce((acc, a) => acc + (a.progress || 0), 0) / total) : 0;

    res.status(200).json({
      success: true,
      message: 'My learning progress summary',
      data: {
        total,
        completed,
        inProgress,
        overdue,
        assigned,
        averageProgress: avgProgress,
      },
    });
  } catch (err) {
    next(err);
  }
}
