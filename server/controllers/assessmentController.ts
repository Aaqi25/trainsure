import { Response, NextFunction } from 'express';
import {
  AssessmentModel,
  AssessmentAttemptModel,
  TrainingModel,
  EvidenceModel,
  SkillModel,
  IAssessment,
  IAssessmentQuestion,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';
import { createNotification } from '../services/notificationService.ts';

export async function getAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const assessments = await AssessmentModel.find();
    const trainings = await TrainingModel.find();

    const enriched = assessments.map(a => {
      const train = trainings.find(t => t._id === a.trainingId);
      return {
        ...a,
        trainingTitle: train ? train.title : 'Course Exam',
        questionCount: (a.questions || []).length,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Assessments retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const assessment = await AssessmentModel.findById(id);
    if (!assessment) {
      throw new AppError('Assessment not found', 404, 'NOT_FOUND');
    }

    const training = await TrainingModel.findById(assessment.trainingId);

    // If Employee, sanitize questions so correctAnswer is not exposed!
    const isEmployee = req.user?.role === 'EMPLOYEE';
    const sanitizedQuestions = (assessment.questions || []).map((q: IAssessmentQuestion) => {
      if (isEmployee) {
        const { correctAnswer: _, ...safeQ } = q;
        return safeQ;
      }
      return q;
    });

    res.status(200).json({
      success: true,
      message: 'Assessment retrieved',
      data: {
        ...assessment,
        questions: sanitizedQuestions,
        training: training ? { _id: training._id, title: training.title } : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { trainingId, title, questions, passingScore, timeLimit } = req.body;

    if (!trainingId || !title || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Training ID, title, and at least one question are required', 400, 'VALIDATION_ERROR');
    }

    const formattedQuestions: IAssessmentQuestion[] = questions.map((q: any, idx: number) => ({
      id: q.id || `q-${Date.now()}-${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: Number(q.correctAnswer) || 0,
      marks: Number(q.marks) || 10,
      explanation: q.explanation || '',
    }));

    const assessment = await AssessmentModel.create({
      trainingId,
      title,
      questions: formattedQuestions,
      passingScore: Number(passingScore) || 70,
      timeLimit: Number(timeLimit) || 20,
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_ASSESSMENT',
      entity: 'Assessment',
      entityId: assessment._id,
      details: { title: assessment.title, questionsCount: formattedQuestions.length },
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { answers } = req.body; // array of { questionId, selectedOption }

    const assessment = await AssessmentModel.findById(id);
    if (!assessment) {
      throw new AppError('Assessment not found', 404, 'NOT_FOUND');
    }

    const employeeId = req.user!._id;
    let earnedMarks = 0;
    let totalMarks = 0;

    const evaluatedAnswers = (assessment.questions || []).map(q => {
      totalMarks += q.marks;
      const userAns = (answers || []).find((a: any) => a.questionId === q.id);
      const selectedOption = userAns ? Number(userAns.selectedOption) : -1;
      const isCorrect = selectedOption === q.correctAnswer;
      const marksEarned = isCorrect ? q.marks : 0;
      earnedMarks += marksEarned;

      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksEarned,
        maxMarks: q.marks,
        explanation: q.explanation,
      };
    });

    const score = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 100;
    const passed = score >= assessment.passingScore;

    const attempt = await AssessmentAttemptModel.create({
      assessmentId: id,
      employeeId,
      answers: evaluatedAnswers.map(a => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        marksEarned: a.marksEarned,
      })),
      score,
      earnedMarks,
      totalMarks,
      passed,
      attemptedAt: new Date().toISOString(),
    });

    // Create Notification
    await createNotification({
      recipientId: employeeId,
      type: 'ASSESSMENT_RESULT',
      title: `Assessment ${passed ? 'Passed' : 'Failed'}: ${assessment.title}`,
      message: `You scored ${score}% (Passing score: ${assessment.passingScore}%). Result: ${passed ? 'PASS' : 'FAIL'}.`,
      link: '/assessments',
    });

    // If passed, create evidence
    if (passed) {
      const training = await TrainingModel.findById(assessment.trainingId);
      const skills = await SkillModel.find();
      const matchedSkill = skills.find(
        s =>
          (training && s.name.toLowerCase() === training.title.toLowerCase()) ||
          (training && s.category.toLowerCase() === training.category.toLowerCase())
      ) || skills[0];

      if (matchedSkill) {
        await EvidenceModel.create({
          employeeId,
          skillId: matchedSkill._id,
          type: 'ASSESSMENT',
          title: `Assessment Score ${score}%: ${assessment.title}`,
          description: `Achieved ${earnedMarks}/${totalMarks} marks (${score}%) in ${assessment.title}.`,
          score,
          verified: true,
          verifiedBy: 'System Auto-Grading Engine',
          verifiedAt: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Assessment submitted: ${passed ? 'PASSED' : 'FAILED'} with ${score}%`,
      data: {
        attemptId: attempt._id,
        score,
        passed,
        earnedMarks,
        totalMarks,
        passingScore: assessment.passingScore,
        detailedReview: evaluatedAnswers,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let attempts = await AssessmentAttemptModel.find({ assessmentId: id });

    // If employee, only see own attempts
    if (req.user?.role === 'EMPLOYEE') {
      attempts = attempts.filter(a => a.employeeId === req.user?._id);
    }

    res.status(200).json({
      success: true,
      message: 'Assessment attempt history',
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
}
