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

  const [certs, assignments, attempts, complianceRecords, allCertMetas, allTrainings] = await Promise.all([
    EmployeeCertificationModel.find({ employeeId }),
    TrainingAssignmentModel.find({ employeeId }),
    AssessmentAttemptModel.find({ employeeId }),
    ComplianceRecordModel.find({ employeeId }),
    CertificationModel.find(),
    TrainingModel.find(),
  ]);

  const certMetaMap = new Map(allCertMetas.map(c => [String(c._id), c]));
  const trainingMap = new Map(allTrainings.map(t => [String(t._id), t]));

  let totalScore = 0;
  const factors: RiskFactor[] = [];
  const now = new Date();

  // 1. Check Certifications
  for (const c of certs) {
    const certMeta = certMetaMap.get(String(c.certificationId));
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
  for (const a of assignments) {
    const training = trainingMap.get(String(a.trainingId));
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
  const [employees, allCerts, allAssignments, allAttempts, allComplianceRecords, allCertMetas, allTrainings] = await Promise.all([
    UserModel.find({ role: 'EMPLOYEE', status: 'ACTIVE' }),
    EmployeeCertificationModel.find(),
    TrainingAssignmentModel.find(),
    AssessmentAttemptModel.find(),
    ComplianceRecordModel.find(),
    CertificationModel.find(),
    TrainingModel.find(),
  ]);

  const certMetaMap = new Map(allCertMetas.map(c => [String(c._id), c]));
  const trainingMap = new Map(allTrainings.map(t => [String(t._id), t]));

  // Index collections by employeeId
  const certsByEmp = new Map<string, any[]>();
  for (const c of allCerts) {
    const list = certsByEmp.get(c.employeeId) || [];
    list.push(c);
    certsByEmp.set(c.employeeId, list);
  }

  const assignmentsByEmp = new Map<string, any[]>();
  for (const a of allAssignments) {
    const list = assignmentsByEmp.get(a.employeeId) || [];
    list.push(a);
    assignmentsByEmp.set(a.employeeId, list);
  }

  const attemptsByEmp = new Map<string, any[]>();
  for (const att of allAttempts) {
    const list = attemptsByEmp.get(att.employeeId) || [];
    list.push(att);
    attemptsByEmp.set(att.employeeId, list);
  }

  const complianceByEmp = new Map<string, any[]>();
  for (const cr of allComplianceRecords) {
    const list = complianceByEmp.get(cr.employeeId) || [];
    list.push(cr);
    complianceByEmp.set(cr.employeeId, list);
  }

  const now = new Date();
  const results: EmployeeRiskAssessment[] = [];

  for (const user of employees) {
    let totalScore = 0;
    const factors: RiskFactor[] = [];
    const certs = certsByEmp.get(user._id) || [];
    const assignments = assignmentsByEmp.get(user._id) || [];
    const attempts = attemptsByEmp.get(user._id) || [];
    const complianceRecords = complianceByEmp.get(user._id) || [];

    // 1. Check Certifications
    for (const c of certs) {
      const certMeta = certMetaMap.get(String(c.certificationId));
      const certName = certMeta ? certMeta.name : 'Certification';
      const expiry = new Date(c.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
    for (const a of assignments) {
      const training = trainingMap.get(String(a.trainingId));
      const title = training ? training.title : 'Assigned Training';
      const dueDate = new Date(a.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
    const nonCompliantRecords = complianceRecords.filter(r => r.status === 'NON_COMPLIANT');
    if (nonCompliantRecords.length > 0) {
      factors.push({
        reason: `${nonCompliantRecords.length} regulatory compliance requirement(s) breached.`,
        contribution: 20,
        category: 'COMPLIANCE',
      });
      totalScore += 20;
    }

    const normalizedScore = Math.min(100, Math.max(0, totalScore));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (normalizedScore >= 61) {
      riskLevel = 'HIGH';
    } else if (normalizedScore >= 31) {
      riskLevel = 'MEDIUM';
    }

    results.push({
      employeeId: user._id,
      employeeName: user.name,
      departmentId: user.departmentId,
      jobTitle: user.jobTitle,
      riskLevel,
      score: normalizedScore,
      factors,
      evaluatedAt: now.toISOString(),
      disclaimer:
        'Compliance Risk Intelligence provides automated decision support based on rule-based policy indicators and must not be used as an autonomous determinant for employment decisions.',
    });
  }

  return results;
}
