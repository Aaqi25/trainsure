import {
  ComplianceRequirementModel,
  ComplianceRecordModel,
  UserModel,
  TrainingAssignmentModel,
  EmployeeCertificationModel,
  TrainingModel,
  CertificationModel,
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
  const [allReqs, assignments, empCerts, allTrainings, allCertMetas] = await Promise.all([
    ComplianceRequirementModel.find(),
    TrainingAssignmentModel.find({ employeeId: user._id }),
    EmployeeCertificationModel.find({ employeeId: user._id, verified: true }),
    TrainingModel.find(),
    CertificationModel.find(),
  ]);

  const trainingMap = new Map(allTrainings.map(t => [String(t._id), t]));
  const certMetaMap = new Map(allCertMetas.map(c => [String(c._id), c]));
  const assignmentMap = new Map(assignments.map(a => [String(a.trainingId), a]));

  const certMap = new Map<string, any[]>();
  for (const c of empCerts) {
    const list = certMap.get(String(c.certificationId)) || [];
    list.push(c);
    certMap.set(String(c.certificationId), list);
  }

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
      const assignment = assignmentMap.get(String(req.targetTrainingId));
      const training = trainingMap.get(String(req.targetTrainingId));
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
      const cert = certMetaMap.get(String(req.targetCertificationId));
      const certName = cert ? cert.name : 'Required Certification';
      const certsForThisReq = certMap.get(String(req.targetCertificationId)) || [];

      if (certsForThisReq.length === 0) {
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
        const latestCert = certsForThisReq.sort(
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
  const [employees, allReqs, allAssignments, allCerts, allTrainings, allCertMetas] = await Promise.all([
    UserModel.find({ role: 'EMPLOYEE', status: 'ACTIVE' }),
    ComplianceRequirementModel.find(),
    TrainingAssignmentModel.find(),
    EmployeeCertificationModel.find({ verified: true }),
    TrainingModel.find(),
    CertificationModel.find(),
  ]);

  const trainingMap = new Map(allTrainings.map(t => [String(t._id), t]));
  const certMetaMap = new Map(allCertMetas.map(c => [String(c._id), c]));

  // Index assignments by `${employeeId}_${trainingId}`
  const assignmentMap = new Map<string, any>();
  for (const a of allAssignments) {
    assignmentMap.set(`${a.employeeId}_${a.trainingId}`, a);
  }

  // Index certs by `${employeeId}_${certificationId}`
  const empCertMap = new Map<string, any[]>();
  for (const c of allCerts) {
    const key = `${c.employeeId}_${c.certificationId}`;
    const list = empCertMap.get(key) || [];
    list.push(c);
    empCertMap.set(key, list);
  }

  const now = new Date();
  const results: EmployeeComplianceEvaluation[] = [];

  for (const user of employees) {
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

    for (const req of applicableReqs) {
      if (req.type === 'TRAINING' && req.targetTrainingId) {
        const assignment = assignmentMap.get(`${user._id}_${req.targetTrainingId}`);
        const training = trainingMap.get(String(req.targetTrainingId));
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
        const cert = certMetaMap.get(String(req.targetCertificationId));
        const certName = cert ? cert.name : 'Required Certification';
        const empCerts = empCertMap.get(`${user._id}_${req.targetCertificationId}`) || [];

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

    let summary = 'All mandatory requirements satisfied and verified.';
    if (overallStatus === 'NON_COMPLIANT') {
      summary = `${nonCompliantCount} non-compliant requirement(s) detected. Immediate action required.`;
    } else if (overallStatus === 'AT_RISK') {
      summary = `${atRiskCount} requirement(s) approaching deadline or expiry. Attention recommended.`;
    }

    results.push({
      employeeId: user._id,
      employeeName: user.name,
      departmentId: user.departmentId,
      jobTitle: user.jobTitle,
      overallStatus,
      score,
      evaluatedAt: now.toISOString(),
      summary,
      requirements: evaluations,
    });
  }

  return results;
}
