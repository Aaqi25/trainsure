import { Response, NextFunction } from 'express';
import { TrainingModel, AssessmentModel, ITraining } from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';

export async function getTrainings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { category, difficulty, mandatory, search, status } = req.query;

    let trainings = await TrainingModel.find();

    if (category) {
      trainings = trainings.filter(t => t.category.toLowerCase() === String(category).toLowerCase());
    }
    if (difficulty) {
      trainings = trainings.filter(t => t.difficulty === String(difficulty));
    }
    if (mandatory !== undefined) {
      trainings = trainings.filter(t => String(t.mandatory) === String(mandatory));
    }
    if (status) {
      trainings = trainings.filter(t => t.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      trainings = trainings.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.instructor.toLowerCase().includes(q)
      );
    }

    // Attach assessment presence info
    const assessments = await AssessmentModel.find();
    const enriched = trainings.map(t => {
      const assess = assessments.find(a => a.trainingId === t._id);
      return {
        ...t,
        moduleCount: (t.modules || []).length,
        hasAssessment: !!assess,
        assessmentId: assess ? assess._id : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Trainings retrieved successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrainingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const training = await TrainingModel.findById(id);
    if (!training) {
      throw new AppError('Training not found', 404, 'NOT_FOUND');
    }

    const assessment = await AssessmentModel.findOne({ trainingId: id });

    res.status(200).json({
      success: true,
      message: 'Training details retrieved',
      data: {
        ...training,
        assessment: assessment
          ? {
              _id: assessment._id,
              title: assessment.title,
              passingScore: assessment.passingScore,
              timeLimit: assessment.timeLimit,
              questionCount: (assessment.questions || []).length,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const {
      title,
      description,
      category,
      instructor,
      duration,
      difficulty,
      mandatory,
      modules,
      startDate,
      endDate,
    } = req.body;

    if (!title || !description || !category) {
      throw new AppError('Title, description, and category are required', 400, 'VALIDATION_ERROR');
    }

    const formattedModules = (modules || []).map((m: any, idx: number) => ({
      id: m.id || `mod-${Date.now()}-${idx}`,
      title: m.title || `Module ${idx + 1}`,
      description: m.description || '',
      content: m.content || '',
      durationMinutes: Number(m.durationMinutes) || 45,
      order: m.order || idx + 1,
    }));

    const created = await TrainingModel.create({
      title,
      description,
      category,
      instructor: instructor || 'TrainSure Faculty',
      duration: Number(duration) || 2,
      difficulty: difficulty || 'BEGINNER',
      mandatory: Boolean(mandatory),
      modules: formattedModules,
      createdBy: req.user!._id,
      startDate,
      endDate,
      status: 'ACTIVE',
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_TRAINING',
      entity: 'Training',
      entityId: created._id,
      details: { title: created.title, mandatory: created.mandatory },
    });

    res.status(201).json({
      success: true,
      message: 'Training created successfully',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await TrainingModel.findById(id);
    if (!existing) {
      throw new AppError('Training not found', 404, 'NOT_FOUND');
    }

    const {
      title,
      description,
      category,
      instructor,
      duration,
      difficulty,
      mandatory,
      modules,
      status,
      startDate,
      endDate,
    } = req.body;

    const patch: Partial<ITraining> = {};
    if (title) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (category) patch.category = category;
    if (instructor) patch.instructor = instructor;
    if (duration !== undefined) patch.duration = Number(duration);
    if (difficulty) patch.difficulty = difficulty;
    if (mandatory !== undefined) patch.mandatory = Boolean(mandatory);
    if (modules) patch.modules = modules;
    if (status) patch.status = status;
    if (startDate !== undefined) patch.startDate = startDate;
    if (endDate !== undefined) patch.endDate = endDate;

    const updated = await TrainingModel.findByIdAndUpdate(id, patch);

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'UPDATE_TRAINING',
      entity: 'Training',
      entityId: id,
    });

    res.status(200).json({
      success: true,
      message: 'Training updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await TrainingModel.findById(id);
    if (!existing) {
      throw new AppError('Training not found', 404, 'NOT_FOUND');
    }

    await TrainingModel.findByIdAndDelete(id);

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'DELETE_TRAINING',
      entity: 'Training',
      entityId: id,
      details: { title: existing.title },
    });

    res.status(200).json({
      success: true,
      message: 'Training deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
