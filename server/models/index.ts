import { MemoryCollection } from '../config/database.ts';

// 1. User Model
export interface IUser {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  departmentId?: string;
  managerId?: string;
  jobTitle: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

// 2. Department Model
export interface IDepartment {
  _id: string;
  name: string;
  description: string;
  managerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 3. Training & Module Model
export interface ITrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  durationMinutes: number;
  order: number;
}

export interface ITraining {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number; // in hours or minutes
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  mandatory: boolean;
  modules: ITrainingModule[];
  createdBy: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

// 4. Training Assignment Model
export interface ITrainingAssignment {
  _id: string;
  employeeId: string;
  trainingId: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number; // 0 to 100
  completedModules: string[];
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 5. Assessment Model
export interface IAssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  marks: number;
  explanation?: string;
}

export interface IAssessment {
  _id: string;
  trainingId: string;
  title: string;
  questions: IAssessmentQuestion[];
  passingScore: number; // e.g. 70
  timeLimit: number; // in minutes, e.g. 30
  createdAt?: string;
  updatedAt?: string;
}

// 6. Assessment Attempt Model
export interface IAttemptAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  marksEarned: number;
}

export interface IAssessmentAttempt {
  _id: string;
  assessmentId: string;
  employeeId: string;
  answers: IAttemptAnswer[];
  score: number; // percentage
  earnedMarks: number;
  totalMarks: number;
  passed: boolean;
  attemptedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// 7. Certification Catalog Model
export interface ICertification {
  _id: string;
  name: string;
  issuer: string;
  validityPeriod: number; // in months
  description: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 8. Employee Certification Record
export interface IEmployeeCertification {
  _id: string;
  employeeId: string;
  certificationId: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  fileUrl?: string;
  fileName?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  createdAt?: string;
  updatedAt?: string;
}

// 9. Compliance Requirement Model
export interface IComplianceRequirement {
  _id: string;
  title: string;
  description: string;
  type: 'TRAINING' | 'CERTIFICATION' | 'ASSESSMENT';
  targetTrainingId?: string;
  targetCertificationId?: string;
  targetRole?: string;
  targetDepartmentId?: string;
  appliesToAll: boolean;
  frequency: 'ANNUAL' | 'BIENNIAL' | 'ONE_TIME';
  gracePeriodDays: number;
  createdAt?: string;
  updatedAt?: string;
}

// 10. Compliance Record Model
export interface IComplianceRecord {
  _id: string;
  employeeId: string;
  requirementId: string;
  status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  lastEvaluatedAt: string;
  reason?: string;
  details?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// 11. Notification Model
export interface INotification {
  _id: string;
  recipientId: string;
  type:
    | 'TRAINING_ASSIGNED'
    | 'TRAINING_DUE_SOON'
    | 'TRAINING_OVERDUE'
    | 'ASSESSMENT_RESULT'
    | 'CERTIFICATION_EXPIRING'
    | 'CERTIFICATION_EXPIRED'
    | 'COMPLIANCE_WARNING'
    | 'EVIDENCE_VERIFICATION';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 12. Skill Model
export interface ISkill {
  _id: string;
  name: string;
  category: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// 13. Employee Skill Profile Model
export interface IEmployeeSkill {
  _id: string;
  employeeId: string;
  skillId: string;
  proficiency: number; // 0 to 100
  evidenceIds: string[];
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 14. Evidence Model
export interface IEvidence {
  _id: string;
  employeeId: string;
  skillId: string;
  type:
    | 'TRAINING'
    | 'ASSESSMENT'
    | 'CERTIFICATION'
    | 'PROJECT'
    | 'MANAGER_VALIDATION'
    | 'EXTERNAL_LEARNING';
  title: string;
  description: string;
  score?: number;
  fileUrl?: string;
  fileName?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 15. Role Model
export interface IRoleSkillReq {
  skillId: string;
  requiredProficiency: number;
}

export interface IRole {
  _id: string;
  name: string;
  description: string;
  requiredSkills: IRoleSkillReq[];
  createdAt?: string;
  updatedAt?: string;
}

// 16. Project Model
export interface IProject {
  _id: string;
  name: string;
  description: string;
  managerId: string;
  requiredSkills: IRoleSkillReq[];
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  assignedEmployeeIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 17. Learning Resource Model
export interface ILearningResource {
  _id: string;
  title: string;
  description: string;
  skillId: string;
  type: 'COURSE' | 'DOCUMENTATION' | 'WORKSHOP' | 'VIDEO' | 'LAB';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string; // e.g. "4 hours"
  url: string;
  provider: string;
  createdAt?: string;
  updatedAt?: string;
}

// 18. Audit Log Model
export interface IAuditLog {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
  createdAt?: string;
}

// Single-source collections exported for controllers and services
export const UserModel = new MemoryCollection<IUser>('users');
export const DepartmentModel = new MemoryCollection<IDepartment>('departments');
export const TrainingModel = new MemoryCollection<ITraining>('trainings');
export const TrainingAssignmentModel = new MemoryCollection<ITrainingAssignment>('assignments');
export const AssessmentModel = new MemoryCollection<IAssessment>('assessments');
export const AssessmentAttemptModel = new MemoryCollection<IAssessmentAttempt>('assessment_attempts');
export const CertificationModel = new MemoryCollection<ICertification>('certifications');
export const EmployeeCertificationModel = new MemoryCollection<IEmployeeCertification>('employee_certifications');
export const ComplianceRequirementModel = new MemoryCollection<IComplianceRequirement>('compliance_requirements');
export const ComplianceRecordModel = new MemoryCollection<IComplianceRecord>('compliance_records');
export const NotificationModel = new MemoryCollection<INotification>('notifications');
export const SkillModel = new MemoryCollection<ISkill>('skills');
export const EmployeeSkillModel = new MemoryCollection<IEmployeeSkill>('employee_skills');
export const EvidenceModel = new MemoryCollection<IEvidence>('evidence');
export const RoleModel = new MemoryCollection<IRole>('roles');
export const ProjectModel = new MemoryCollection<IProject>('projects');
export const LearningResourceModel = new MemoryCollection<ILearningResource>('learning_resources');
export const AuditLogModel = new MemoryCollection<IAuditLog>('audit_logs');
