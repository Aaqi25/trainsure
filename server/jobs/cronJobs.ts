import cron from 'node-cron';
import {
  EmployeeCertificationModel,
  TrainingAssignmentModel,
  TrainingModel,
  CertificationModel,
} from '../models/index.ts';
import { createNotification } from '../services/notificationService.ts';
import { evaluateAllEmployeesCompliance } from '../services/complianceService.ts';

let isCronInitialized = false;

export async function runCertificationExpiryJob() {
  console.log('[Cron Job] Checking certification expiry status...');
  try {
    const certs = await EmployeeCertificationModel.find();
    const now = new Date();

    for (const cert of certs) {
      const expiry = new Date(cert.expiryDate);
      const diffDays = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
      if (diffDays <= 0) {
        newStatus = 'EXPIRED';
      } else if (diffDays <= 30) {
        newStatus = 'EXPIRING_SOON';
      }

      if (cert.status !== newStatus) {
        await EmployeeCertificationModel.findByIdAndUpdate(cert._id, {
          status: newStatus,
        });

        const certInfo = await CertificationModel.findById(cert.certificationId);
        const name = certInfo ? certInfo.name : 'Certification';

        if (newStatus === 'EXPIRED') {
          await createNotification({
            recipientId: cert.employeeId,
            type: 'CERTIFICATION_EXPIRED',
            title: `Certification Expired: ${name}`,
            message: `Your ${name} expired on ${expiry.toLocaleDateString()}. Please recertify and upload proof.`,
            link: '/certifications',
          });
        } else if (newStatus === 'EXPIRING_SOON') {
          await createNotification({
            recipientId: cert.employeeId,
            type: 'CERTIFICATION_EXPIRING',
            title: `Certification Expiring Soon: ${name}`,
            message: `Your ${name} will expire in ${diffDays} day(s) on ${expiry.toLocaleDateString()}. Plan your renewal.`,
            link: '/certifications',
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[Cron Job] Error in certification expiry check job:', err.message);
  }
}

export async function runTrainingDeadlineJob() {
  console.log('[Cron Job] Checking training deadlines and overdue assignments...');
  try {
    const assignments = await TrainingAssignmentModel.find({
      status: { $ne: 'COMPLETED' },
    });
    const now = new Date();

    for (const a of assignments) {
      const dueDate = new Date(a.dueDate);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const training = await TrainingModel.findById(a.trainingId);
      const title = training ? training.title : 'Course';

      if (diffDays < 0 && a.status !== 'OVERDUE') {
        await TrainingAssignmentModel.findByIdAndUpdate(a._id, {
          status: 'OVERDUE',
        });

        await createNotification({
          recipientId: a.employeeId,
          type: 'TRAINING_OVERDUE',
          title: `Training Overdue: ${title}`,
          message: `Your assigned training "${title}" was due on ${dueDate.toLocaleDateString()} and is now marked overdue.`,
          link: '/training',
        });
      } else if (diffDays >= 0 && diffDays <= 3) {
        await createNotification({
          recipientId: a.employeeId,
          type: 'TRAINING_DUE_SOON',
          title: `Training Due Soon: ${title}`,
          message: `Your training course "${title}" is due in ${diffDays} day(s) (${dueDate.toLocaleDateString()}). Current progress: ${a.progress}%.`,
          link: '/training',
        });
      }
    }
  } catch (err: any) {
    console.warn('[Cron Job] Error in training deadline job:', err.message);
  }
}

export async function runComplianceCheckJob() {
  console.log('[Cron Job] Running daily compliance evaluation sweep...');
  try {
    const results = await evaluateAllEmployeesCompliance();
    for (const r of results) {
      if (r.overallStatus === 'NON_COMPLIANT' || r.overallStatus === 'AT_RISK') {
        await createNotification({
          recipientId: r.employeeId,
          type: 'COMPLIANCE_WARNING',
          title: `Compliance Status Alert: ${r.overallStatus}`,
          message: `Your organizational compliance status is currently ${r.overallStatus}. ${r.summary}`,
          link: '/compliance',
        });
      }
    }
  } catch (err: any) {
    console.warn('[Cron Job] Error in compliance check job:', err.message);
  }
}

export function initCronJobs() {
  if (isCronInitialized) {
    console.log('[TrainSure Cron] Background cron jobs already registered. Skipping duplicate initialization.');
    return;
  }

  // Run once daily at 01:00 AM UTC
  cron.schedule('0 1 * * *', async () => {
    try {
      await runCertificationExpiryJob();
      await runTrainingDeadlineJob();
      await runComplianceCheckJob();
    } catch (e) {
      console.error('[TrainSure Cron Error]', e);
    }
  });

  isCronInitialized = true;
  console.log('[TrainSure Cron] Scheduled daily jobs (Expiry, Deadlines, Compliance).');
}

export async function runAllJobsNow() {
  await runCertificationExpiryJob();
  await runTrainingDeadlineJob();
  await runComplianceCheckJob();
}
