import {
  ComplianceRequirementModel,
  ComplianceRecordModel,
  UserModel,
  TrainingAssignmentModel,
  EmployeeCertificationModel,
  TrainingModel,
  CertificationModel,
  IComplianceRecord,
  IUser,
} from '../models/index.ts';

export interface EmployeeComplianceEvaluation {
  employeeId: string;
  employeeName: string;
  departmentId?: string;
  jobTitle: string;
  overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  score: number; // 0 - 100 compliance rating
  evaluatedAt: string;
  summary: string;
  requirements: Array<{
    requirementId: string;
    title: string;
    type: 'TRAINING' | 'CERTIFICATION' | 'ASSESSMENT';
    status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    reason: string;
    details: Record<string, any>;
  }>;
}

export async function evaluateEmployeeCompliance(
  employeeId: string
): Promise<EmployeeComplianceEvaluation> {
  const user = await UserModel.findById(employeeId);
  if (!user) {
    throw new Error('Employee not found');
  }

  // Find all requirements that apply to this employee
  const allReqs = await ComplianceRequirementModel.find();
  const applicableReqs = allReqs.filter(req => {
    if (req.appliesToAll) return true;
    if (req.targetDepartmentId && req.targetDepartmentId === user.departmentId) return true;
    if (req.targetRole && req.targetRole.toLowerCase() === user.jobTitle.toLowerCase()) return true;
    return false;
  });

  const evaluations: EmployeeComplianceEvaluation['requirements'] = [];
  let nonCompliantCount = 0;
  let atRiskCount = 0;
  let compliantCount = 0;

  const now = new Date();

  for (const req of applicableReqs) {
    if (req.type === 'TRAINING' && req.targetTrainingId) {
      const assignment = await TrainingAssignmentModel.findOne({
        employeeId: user._id,
        trainingId: req.targetTrainingId,
      });

      const training = await TrainingModel.findById(req.targetTrainingId);
      const trainingTitle = training ? training.title : 'Mandatory Course';

      if (!assignment) {
        nonCompliantCount++;
        evaluations.push({
          requirementId: req._id,
          title: req.title,
          type: 'TRAINING',
          status: 'NON_COMPLIANT',
          reason: `Mandatory training "${trainingTitle}" is not yet assigned or completed.`,
          details: { trainingId: req.targetTrainingId, trainingTitle, assignmentStatus: 'NOT_ASSIGNED' },
        });
      } else if (assignment.status === 'COMPLETED') {
        compliantCount++;
        evaluations.push({
          requirementId: req._id,
          title: req.title,
          type: 'TRAINING',
          status: 'COMPLIANT',
          reason: `Mandatory training "${trainingTitle}" completed (100%).`,
          details: { trainingId: req.targetTrainingId, trainingTitle, progress: assignment.progress },
        });
      } else if (assignment.status === 'OVERDUE' || new Date(assignment.dueDate) < now) {
        nonCompliantCount++;
        evaluations.push({
          requirementId: req._id,
          title: req.title,
          type: 'TRAINING',
          status: 'NON_COMPLIANT',
          reason: `Mandatory training "${trainingTitle}" is overdue (Due: ${new Date(assignment.dueDate).toLocaleDateString()}).`,
          details: { trainingId: req.targetTrainingId, trainingTitle, dueDate: assignment.dueDate },
        });
      } else {
        // In progress or assigned
        const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7) {
          atRiskCount++;
          evaluations.push({
            requirementId: req._id,
            title: req.title,
            type: 'TRAINING',
            status: 'AT_RISK',
            reason: `Mandatory training "${trainingTitle}" is in progress with deadline in ${daysLeft} day(s).`,
            details: { trainingId: req.targetTrainingId, trainingTitle, daysLeft, progress: assignment.progress },
          });
        } else {
          compliantCount++;
          evaluations.push({
            requirementId: req._id,
            title: req.title,
            type: 'TRAINING',
            status: 'COMPLIANT',
            reason: `Mandatory training "${trainingTitle}" is actively on schedule (${assignment.progress}%).`,
            details: { trainingId: req.targetTrainingId, trainingTitle, daysLeft, progress: assignment.progress },
          });
        }
      }
    } else if (req.type === 'CERTIFICATION' && req.targetCertificationId) {
      const cert = await CertificationModel.findById(req.targetCertificationId);
      const certName = cert ? cert.name : 'Required Certification';

      const empCerts = await EmployeeCertificationModel.find({
        employeeId: user._id,
        certificationId: req.targetCertificationId,
        verified: true,
      });

      if (empCerts.length === 0) {
        nonCompliantCount++;
        evaluations.push({
          requirementId: req._id,
          title: req.title,
          type: 'CERTIFICATION',
          status: 'NON_COMPLIANT',
          reason: `Required certification "${certName}" is missing or unverified.`,
          details: { certificationId: req.targetCertificationId, certName, verified: false },
        });
      } else {
        // Check expiry date
        const latestCert = empCerts.sort(
          (a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
        )[0];

        const expiry = new Date(latestCert.expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          nonCompliantCount++;
          evaluations.push({
            requirementId: req._id,
            title: req.title,
            type: 'CERTIFICATION',
            status: 'NON_COMPLIANT',
            reason: `Certification "${certName}" expired on ${expiry.toLocaleDateString()}. Renewal required immediately.`,
            details: { certificationId: req.targetCertificationId, certName, expiryDate: latestCert.expiryDate },
          });
        } else if (daysUntilExpiry <= 30) {
          atRiskCount++;
          evaluations.push({
            requirementId: req._id,
            title: req.title,
            type: 'CERTIFICATION',
            status: 'AT_RISK',
            reason: `Certification "${certName}" is valid but expiring soon in ${daysUntilExpiry} days (${expiry.toLocaleDateString()}).`,
            details: { certificationId: req.targetCertificationId, certName, daysUntilExpiry, expiryDate: latestCert.expiryDate },
          });
        } else {
          compliantCount++;
          evaluations.push({
            requirementId: req._id,
            title: req.title,
            type: 'CERTIFICATION',
            status: 'COMPLIANT',
            reason: `Certification "${certName}" is verified and active (Valid until ${expiry.toLocaleDateString()}).`,
            details: { certificationId: req.targetCertificationId, certName, daysUntilExpiry, expiryDate: latestCert.expiryDate },
          });
        }
      }
    }
  }

  let overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' = 'COMPLIANT';
  if (nonCompliantCount > 0) {
    overallStatus = 'NON_COMPLIANT';
  } else if (atRiskCount > 0) {
    overallStatus = 'AT_RISK';
  }

  const totalReqs = applicableReqs.length;
  const score = totalReqs === 0 ? 100 : Math.round((compliantCount / totalReqs) * 100);

  // Update or persist compliance record
  for (const item of evaluations) {
    const existing = await ComplianceRecordModel.findOne({
      employeeId: user._id,
      requirementId: item.requirementId,
    });
    if (existing) {
      await ComplianceRecordModel.findByIdAndUpdate(existing._id, {
        status: item.status,
        lastEvaluatedAt: new Date().toISOString(),
        reason: item.reason,
        details: item.details,
      });
    } else {
      await ComplianceRecordModel.create({
        employeeId: user._id,
        requirementId: item.requirementId,
        status: item.status,
        lastEvaluatedAt: new Date().toISOString(),
        reason: item.reason,
        details: item.details,
      });
    }
  }

  let summary = 'All mandatory requirements satisfied and verified.';
  if (overallStatus === 'NON_COMPLIANT') {
    summary = `${nonCompliantCount} non-compliant requirement(s) detected. Immediate action required.`;
  } else if (overallStatus === 'AT_RISK') {
    summary = `${atRiskCount} requirement(s) approaching deadline or expiry. Attention recommended.`;
  }

  return {
    employeeId: user._id,
    employeeName: user.name,
    departmentId: user.departmentId,
    jobTitle: user.jobTitle,
    overallStatus,
    score,
    evaluatedAt: new Date().toISOString(),
    summary,
    requirements: evaluations,
  };
}

export async function evaluateAllEmployeesCompliance(): Promise<EmployeeComplianceEvaluation[]> {
  const employees = await UserModel.find({ role: 'EMPLOYEE', status: 'ACTIVE' });
  const results: EmployeeComplianceEvaluation[] = [];
  for (const emp of employees) {
    const res = await evaluateEmployeeCompliance(emp._id);
    results.push(res);
  }
  return results;
}
