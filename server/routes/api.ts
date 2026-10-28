import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  getDemoUsers,
  switchDemoUser,
} from '../controllers/authController.ts';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.ts';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.ts';
import {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
} from '../controllers/trainingController.ts';
import {
  createAssignment,
  getAssignments,
  getMyAssignments,
  updateProgress,
  getMyProgress,
} from '../controllers/assignmentController.ts';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  submitAssessment,
  getAssessmentResults,
} from '../controllers/assessmentController.ts';
import {
  getCertifications,
  createCertification,
  uploadEmployeeCertification,
  getEmployeeCertifications,
  getMyEmployeeCertifications,
  verifyEmployeeCertification,
} from '../controllers/certificationController.ts';
import {
  getComplianceRequirements,
  createComplianceRequirement,
  getComplianceOverview,
  getAtRiskCompliance,
  getNonCompliantCompliance,
  getEmployeeCompliance,
} from '../controllers/complianceController.ts';
import {
  getSkills,
  createSkill,
  getEmployeeSkills,
  addEmployeeSkill,
  updateEmployeeSkill,
} from '../controllers/skillController.ts';
import {
  submitEvidence,
  getEvidence,
  getMyEvidence,
  verifyEvidence,
} from '../controllers/evidenceController.ts';
import {
  getRoles,
  createRole,
  getProjects,
  createProject,
  getLearningResources,
  createLearningResource,
} from '../controllers/roleProjectController.ts';
import {
  getSkillGaps,
  getReadiness,
  getRecommendations,
  getRiskAssessment,
  getAllEmployeesRisk,
} from '../controllers/intelligenceController.ts';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.ts';
import {
  getAdminAnalytics,
  getManagerAnalytics,
  getEmployeeAnalytics,
  getAuditLogs,
  triggerBackgroundJobs,
  triggerResetSeed,
} from '../controllers/analyticsController.ts';

import {
  authenticate,
  requireAdmin,
  requireManagerOrAdmin,
} from '../middleware/auth.ts';
import { upload } from '../middleware/upload.ts';
import { isMongoConnected } from '../config/database.ts';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const isHealthy = !isProd || isMongoConnected;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy
      ? 'TrainSure backend API service is operational'
      : 'TrainSure backend API service is degraded: persistent database connection unavailable',
    data: {
      status: isHealthy ? 'UP' : 'DEGRADED',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: isMongoConnected
        ? 'CONNECTED'
        : isProd
        ? 'DISCONNECTED'
        : 'EMBEDDED_DEV_MODE',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Authentication
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticate, getMe);
router.get('/auth/demo-users', getDemoUsers);
router.post('/auth/switch-demo', switchDemoUser);

// Users
router.get('/users', authenticate, getUsers);
router.get('/users/:id', authenticate, getUserById);
router.post('/users', authenticate, requireAdmin, createUser);
router.patch('/users/:id', authenticate, requireManagerOrAdmin, updateUser);
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

// Departments
router.get('/departments', authenticate, getDepartments);
router.get('/departments/:id', authenticate, getDepartmentById);
router.post('/departments', authenticate, requireAdmin, createDepartment);
router.patch('/departments/:id', authenticate, requireAdmin, updateDepartment);
router.delete('/departments/:id', authenticate, requireAdmin, deleteDepartment);

// Training Management
router.get('/trainings', authenticate, getTrainings);
router.get('/trainings/:id', authenticate, getTrainingById);
router.post('/trainings', authenticate, requireAdmin, createTraining);
router.patch('/trainings/:id', authenticate, requireAdmin, updateTraining);
router.delete('/trainings/:id', authenticate, requireAdmin, deleteTraining);

// Training Assignments & Progress
router.post('/assignments', authenticate, requireManagerOrAdmin, createAssignment);
router.get('/assignments', authenticate, requireManagerOrAdmin, getAssignments);
router.get('/assignments/my', authenticate, getMyAssignments);
router.get('/progress/my', authenticate, getMyProgress);
router.patch('/progress/:assignmentId', authenticate, updateProgress);

// Assessments
router.get('/assessments', authenticate, getAssessments);
router.get('/assessments/:id', authenticate, getAssessmentById);
router.post('/assessments', authenticate, requireManagerOrAdmin, createAssessment);
router.post('/assessments/:id/submit', authenticate, submitAssessment);
router.get('/assessments/:id/results', authenticate, getAssessmentResults);

// Certifications
router.get('/certifications', authenticate, getCertifications);
router.post('/certifications', authenticate, requireAdmin, createCertification);
router.post(
  '/employee-certifications',
  authenticate,
  upload.single('file'),
  uploadEmployeeCertification
);
router.get(
  '/employee-certifications',
  authenticate,
  requireManagerOrAdmin,
  getEmployeeCertifications
);
router.get(
  '/employee-certifications/my',
  authenticate,
  getMyEmployeeCertifications
);
router.patch(
  '/employee-certifications/:id',
  authenticate,
  requireManagerOrAdmin,
  verifyEmployeeCertification
);

// Compliance Engine
router.get('/compliance/requirements', authenticate, getComplianceRequirements);
router.post(
  '/compliance/requirements',
  authenticate,
  requireAdmin,
  createComplianceRequirement
);
router.get('/compliance', authenticate, getComplianceOverview);
router.get('/compliance/at-risk', authenticate, getAtRiskCompliance);
router.get('/compliance/non-compliant', authenticate, getNonCompliantCompliance);
router.get('/compliance/:employeeId', authenticate, getEmployeeCompliance);

// Skills & Evidence
router.get('/skills', authenticate, getSkills);
router.post('/skills', authenticate, requireAdmin, createSkill);
router.get('/employees/:id/skills', authenticate, getEmployeeSkills);
router.post('/employees/:id/skills', authenticate, addEmployeeSkill);
router.patch('/employees/:id/skills/:skillId', authenticate, updateEmployeeSkill);

router.post('/evidence', authenticate, upload.single('file'), submitEvidence);
router.get('/evidence', authenticate, requireManagerOrAdmin, getEvidence);
router.get('/evidence/my', authenticate, getMyEvidence);
router.patch('/evidence/:id/verify', authenticate, requireManagerOrAdmin, verifyEvidence);

// Roles, Projects, & Learning Resources
router.get('/roles', authenticate, getRoles);
router.post('/roles', authenticate, requireAdmin, createRole);
router.get('/projects', authenticate, getProjects);
router.post('/projects', authenticate, requireManagerOrAdmin, createProject);
router.get('/learning-resources', authenticate, getLearningResources);
router.post('/learning-resources', authenticate, requireAdmin, createLearningResource);

// Intelligence: Skill Gaps, Readiness, Recommendations & Risk
router.get('/skill-gaps/:employeeId/role/:roleId', authenticate, getSkillGaps);
router.get('/skill-gaps/:employeeId/project/:projectId', authenticate, getSkillGaps);
router.get('/readiness/:employeeId/role/:roleId', authenticate, getReadiness);
router.get('/readiness/:employeeId/project/:projectId', authenticate, getReadiness);
router.get('/recommendations/my', authenticate, getRecommendations);
router.get('/recommendations/:employeeId', authenticate, getRecommendations);
router.get('/risk', authenticate, requireManagerOrAdmin, getAllEmployeesRisk);
router.get('/risk/my', authenticate, getRiskAssessment);
router.get('/risk/:employeeId', authenticate, getRiskAssessment);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/read-all', authenticate, markAllAsRead);
router.patch('/notifications/:id/read', authenticate, markAsRead);

// Analytics & Audit
router.get('/analytics/admin', authenticate, requireAdmin, getAdminAnalytics);
router.get('/analytics/manager', authenticate, requireManagerOrAdmin, getManagerAnalytics);
router.get('/analytics/employee', authenticate, getEmployeeAnalytics);
router.get('/audit-logs', authenticate, requireAdmin, getAuditLogs);
router.post('/admin/run-jobs', authenticate, requireAdmin, triggerBackgroundJobs);
router.post('/admin/reset-seed', authenticate, requireAdmin, triggerResetSeed);

export default router;
