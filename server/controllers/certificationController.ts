import { Response, NextFunction } from 'express';
import {
  CertificationModel,
  EmployeeCertificationModel,
  UserModel,
  EvidenceModel,
  SkillModel,
  IEmployeeCertification,
} from '../models/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { logAudit } from '../services/auditService.ts';
import { createNotification } from '../services/notificationService.ts';

export async function getCertifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const certs = await CertificationModel.find();
    res.status(200).json({
      success: true,
      message: 'Certifications catalog retrieved',
      data: certs,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, issuer, validityPeriod, description, category } = req.body;
    if (!name || !issuer) {
      throw new AppError('Name and issuer are required', 400, 'VALIDATION_ERROR');
    }

    const cert = await CertificationModel.create({
      name,
      issuer,
      validityPeriod: Number(validityPeriod) || 24,
      description: description || '',
      category: category || 'General',
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_CERTIFICATION_CATALOG',
      entity: 'Certification',
      entityId: cert._id,
      details: { name: cert.name, issuer: cert.issuer },
    });

    res.status(201).json({
      success: true,
      message: 'Certification added to catalog',
      data: cert,
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadEmployeeCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { certificationId, certificateNumber, issueDate, expiryDate, employeeId } = req.body;

    // Target employee: if Admin/Manager can specify another employee, otherwise authenticated user
    const targetEmployeeId =
      req.user?.role !== 'EMPLOYEE' && employeeId ? employeeId : req.user!._id;

    if (!certificationId || !certificateNumber || !issueDate || !expiryDate) {
      throw new AppError('Certification, certificate number, issue date, and expiry date are required', 400, 'VALIDATION_ERROR');
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
      throw new AppError('Expiration date must be strictly after the issue date', 422, 'INVALID_DATE_RANGE');
    }

    const certMeta = await CertificationModel.findById(certificationId);
    if (!certMeta) {
      throw new AppError('Certification definition not found in catalog', 404, 'NOT_FOUND');
    }

    // Determine status based on remaining days
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
    if (diffDays <= 0) {
      status = 'EXPIRED';
    } else if (diffDays <= 30) {
      status = 'EXPIRING_SOON';
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const isDirectlyVerified = req.user?.role === 'ADMIN';

    const empCert = await EmployeeCertificationModel.create({
      employeeId: targetEmployeeId,
      certificationId,
      certificateNumber,
      issueDate,
      expiryDate,
      fileUrl,
      fileName,
      verified: isDirectlyVerified,
      verifiedBy: isDirectlyVerified ? req.user?._id : undefined,
      verifiedAt: isDirectlyVerified ? new Date().toISOString() : undefined,
      status,
    });

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'UPLOAD_CERTIFICATION',
      entity: 'EmployeeCertification',
      entityId: empCert._id,
      details: {
        certificationName: certMeta.name,
        certificateNumber,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: empCert,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeCertifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, verified, employeeId } = req.query;

    let certs = await EmployeeCertificationModel.find();

    if (req.user?.role === 'MANAGER' && !employeeId) {
      const myTeam = await UserModel.find({ managerId: req.user._id });
      const teamIds = new Set(myTeam.map(t => t._id));
      certs = certs.filter(c => teamIds.has(c.employeeId));
    }

    if (employeeId) {
      certs = certs.filter(c => c.employeeId === String(employeeId));
    }
    if (status) {
      certs = certs.filter(c => c.status === String(status));
    }
    if (verified !== undefined) {
      certs = certs.filter(c => String(c.verified) === String(verified));
    }

    const catalog = await CertificationModel.find();
    const users = await UserModel.find();

    const enriched = certs.map(c => {
      const meta = catalog.find(m => m._id === c.certificationId);
      const emp = users.find(u => u._id === c.employeeId);
      const verifier = c.verifiedBy ? users.find(u => u._id === c.verifiedBy) : null;

      // Dynamic expiry recalculation
      const now = new Date();
      const expiry = new Date(c.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let currentStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
      if (diffDays <= 0) currentStatus = 'EXPIRED';
      else if (diffDays <= 30) currentStatus = 'EXPIRING_SOON';

      return {
        ...c,
        status: currentStatus,
        daysUntilExpiry: diffDays,
        certification: meta || null,
        employee: emp ? { _id: emp._id, name: emp.name, email: emp.email, departmentId: emp.departmentId } : null,
        verifiedByUser: verifier ? { _id: verifier._id, name: verifier.name } : null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Employee certifications retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEmployeeCertifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!._id;
    const certs = await EmployeeCertificationModel.find({ employeeId });
    const catalog = await CertificationModel.find();

    const now = new Date();
    const enriched = certs.map(c => {
      const meta = catalog.find(m => m._id === c.certificationId);
      const expiry = new Date(c.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let currentStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
      if (diffDays <= 0) currentStatus = 'EXPIRED';
      else if (diffDays <= 30) currentStatus = 'EXPIRING_SOON';

      return {
        ...c,
        status: currentStatus,
        daysUntilExpiry: diffDays,
        certification: meta || null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'My certifications retrieved',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmployeeCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const empCert = await EmployeeCertificationModel.findById(id);
    if (!empCert) {
      throw new AppError('Certification record not found', 404, 'NOT_FOUND');
    }

    const updated = await EmployeeCertificationModel.findByIdAndUpdate(id, {
      verified: Boolean(verified),
      verifiedBy: req.user!._id,
      verifiedAt: new Date().toISOString(),
    });

    const certMeta = await CertificationModel.findById(empCert.certificationId);
    const certName = certMeta ? certMeta.name : 'Certification';

    // If verified, generate skill evidence
    if (verified) {
      const skills = await SkillModel.find();
      const matchedSkill = skills.find(
        s =>
          (certMeta && s.name.toLowerCase() === certMeta.name.toLowerCase()) ||
          (certMeta && s.category.toLowerCase() === certMeta.category?.toLowerCase())
      ) || skills[0];

      if (matchedSkill) {
        await EvidenceModel.create({
          employeeId: empCert.employeeId,
          skillId: matchedSkill._id,
          type: 'CERTIFICATION',
          title: `Verified Certification: ${certName}`,
          description: `Credential #${empCert.certificateNumber} verified by ${req.user!.name}. Valid through ${new Date(empCert.expiryDate).toLocaleDateString()}.`,
          score: 95,
          verified: true,
          verifiedBy: req.user!._id,
          verifiedAt: new Date().toISOString(),
        });
      }

      await createNotification({
        recipientId: empCert.employeeId,
        type: 'EVIDENCE_VERIFICATION',
        title: `Certificate Verified: ${certName}`,
        message: `Your credential #${empCert.certificateNumber} has been verified by ${req.user!.name}.`,
        link: '/certifications',
      });
    }

    await logAudit({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: verified ? 'VERIFY_CERTIFICATION' : 'REJECT_CERTIFICATION',
      entity: 'EmployeeCertification',
      entityId: id,
    });

    res.status(200).json({
      success: true,
      message: `Certificate ${verified ? 'verified' : 'unverified'} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
