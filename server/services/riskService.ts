import {
  UserModel,
  TrainingAssignmentModel,
  EmployeeCertificationModel,
  AssessmentAttemptModel,
  ComplianceRecordModel,
  TrainingModel,
  CertificationModel,
} from '../models/index.ts';

export interface RiskFactor {
  reason: string;
  contribution: number;
  category: 'CERTIFICATION' | 'TRAINING' | 'ASSESSMENT' | 'COMPLIANCE';
}

export interface EmployeeRiskAssessment {
  employeeId: string;
  employeeName: string;
  departmentId?: string;
  jobTitle: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0 to 100
  factors: RiskFactor[];
  evaluatedAt: string;
  disclaimer: string;
}

export async function calculateEmployeeRisk(
  employeeId: string
): Promise<EmployeeRiskAssessment> {
  const user = await UserModel.findById(employeeId);
  if (!user) {
    throw new Error('Employee not found');
  }

  let totalScore = 0;
  const factors: RiskFactor[] = [];
  const now = new Date();

  // 1. Check Certifications
  const certs = await EmployeeCertificationModel.find({ employeeId });
  for (const c of certs) {
    const certMeta = await CertificationModel.findById(c.certificationId);
    const certName = certMeta ? certMeta.name : 'Certification';

    const expiry = new Date(c.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      factors.push({
        reason: `Expired certification: "${certName}" expired on ${expiry.toLocaleDateString()}`,
        contribution: 40,
        category: 'CERTIFICATION',
      });
      totalScore += 40;
    } else if (daysUntilExpiry <= 15) {
      factors.push({
        reason: `Certification expiring very soon: "${certName}" expires in ${daysUntilExpiry} day(s)`,
        contribution: 25,
        category: 'CERTIFICATION',
      });
      totalScore += 25;
    } else if (daysUntilExpiry <= 30) {
      factors.push({
        reason: `Certification renewal window active: "${certName}" expires in ${daysUntilExpiry} days`,
        contribution: 15,
        category: 'CERTIFICATION',
      });
      totalScore += 15;
    }
  }

  // 2. Check Training Assignments
  const assignments = await TrainingAssignmentModel.find({ employeeId });
  for (const a of assignments) {
    const training = await TrainingModel.findById(a.trainingId);
    const title = training ? training.title : 'Assigned Training';

    const dueDate = new Date(a.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (a.status === 'OVERDUE' || (a.status !== 'COMPLETED' && daysUntilDue < 0)) {
      factors.push({
        reason: `Overdue training: "${title}" missed due date (${dueDate.toLocaleDateString()})`,
        contribution: 20,
        category: 'TRAINING',
      });
      totalScore += 20;
    } else if (a.status !== 'COMPLETED' && daysUntilDue <= 3) {
      factors.push({
        reason: `Urgent training deadline: "${title}" is due in ${daysUntilDue} day(s) at ${a.progress}% progress`,
        contribution: 15,
        category: 'TRAINING',
      });
      totalScore += 15;
    }
  }

  // 3. Check Assessment Attempts
  const attempts = await AssessmentAttemptModel.find({ employeeId });
  const failedAttempts = attempts.filter(att => !att.passed);
  if (failedAttempts.length > 0) {
    const latestFail = failedAttempts[failedAttempts.length - 1];
    factors.push({
      reason: `Recent assessment failure (${latestFail.score}% score). Retake pending.`,
      contribution: 15,
      category: 'ASSESSMENT',
    });
    totalScore += 15;
  }

  // 4. Check Compliance Records
  const complianceRecords = await ComplianceRecordModel.find({ employeeId });
  const nonCompliantRecords = complianceRecords.filter(
    r => r.status === 'NON_COMPLIANT'
  );
  if (nonCompliantRecords.length > 0) {
    factors.push({
      reason: `${nonCompliantRecords.length} regulatory compliance requirement(s) breached.`,
      contribution: 20,
      category: 'COMPLIANCE',
    });
    totalScore += 20;
  }

  // Clamp total score 0 - 100
  const normalizedScore = Math.min(100, Math.max(0, totalScore));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (normalizedScore >= 61) {
    riskLevel = 'HIGH';
  } else if (normalizedScore >= 31) {
    riskLevel = 'MEDIUM';
  }

  return {
    employeeId: user._id,
    employeeName: user.name,
    departmentId: user.departmentId,
    jobTitle: user.jobTitle,
    riskLevel,
    score: normalizedScore,
    factors,
    evaluatedAt: new Date().toISOString(),
    disclaimer:
      'Compliance Risk Intelligence provides automated decision support based on rule-based policy indicators and must not be used as an autonomous determinant for employment decisions.',
  };
}

export async function calculateAllEmployeesRisk(): Promise<EmployeeRiskAssessment[]> {
  const employees = await UserModel.find({ role: 'EMPLOYEE', status: 'ACTIVE' });
  const results: EmployeeRiskAssessment[] = [];
  for (const emp of employees) {
    const risk = await calculateEmployeeRisk(emp._id);
    results.push(risk);
  }
  return results;
}
