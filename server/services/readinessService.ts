import {
  UserModel,
  RoleModel,
  ProjectModel,
  SkillModel,
  EmployeeSkillModel,
  EvidenceModel,
  IRoleSkillReq,
  IEvidence,
} from '../models/index.ts';

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  status: 'MATCH' | 'GAP' | 'MISSING';
  requiredProficiency: number;
  employeeProficiency: number;
  gap: number; // required - employee (clamped to 0 min)
  verified: boolean;
  evidenceCount: number;
  evidence: Array<{
    id: string;
    type: string;
    title: string;
    score?: number;
    fileUrl?: string;
    verified: boolean;
    createdAt: string;
  }>;
}

export interface ReadinessResult {
  employeeId: string;
  employeeName: string;
  targetType: 'ROLE' | 'PROJECT';
  targetId: string;
  targetName: string;
  targetDescription: string;
  readinessPercentage: number;
  status: 'READY' | 'NEAR_READY' | 'NEEDS_DEVELOPMENT';
  totalRequiredSkills: number;
  matchedSkillsCount: number;
  gapSkillsCount: number;
  missingSkillsCount: number;
  skills: SkillGapItem[];
  matchedSkills: SkillGapItem[];
  gapSkills: SkillGapItem[];
  missingSkills: SkillGapItem[];
  recommendationSummary: string;
}

export async function calculateReadiness(
  employeeId: string,
  targetType: 'ROLE' | 'PROJECT',
  targetId: string
): Promise<ReadinessResult> {
  const user = await UserModel.findById(employeeId);
  if (!user) {
    throw new Error('Employee not found');
  }

  let targetName = '';
  let targetDescription = '';
  let requiredSkills: IRoleSkillReq[] = [];

  if (targetType === 'ROLE') {
    const role = await RoleModel.findById(targetId);
    if (!role) throw new Error('Role not found');
    targetName = role.name;
    targetDescription = role.description;
    requiredSkills = role.requiredSkills || [];
  } else {
    const project = await ProjectModel.findById(targetId);
    if (!project) throw new Error('Project not found');
    targetName = project.name;
    targetDescription = project.description;
    requiredSkills = project.requiredSkills || [];
  }

  // Fetch employee skills & evidence
  const empSkills = await EmployeeSkillModel.find({ employeeId });
  const empEvidence = await EvidenceModel.find({ employeeId });

  const skillsList: SkillGapItem[] = [];
  let sumRequired = 0;
  let sumAchieved = 0;

  for (const req of requiredSkills) {
    const skillMeta = await SkillModel.findById(req.skillId);
    const skillName = skillMeta ? skillMeta.name : 'Unknown Skill';
    const category = skillMeta ? skillMeta.category : 'General';

    const empSkill = empSkills.find(s => s.skillId === req.skillId);
    const employeeProficiency = empSkill ? empSkill.proficiency : 0;
    const isVerified = empSkill ? empSkill.verified : false;

    // Filter evidence for this skill
    const skillEvidences = empEvidence.filter(e => e.skillId === req.skillId);

    sumRequired += req.requiredProficiency;
    sumAchieved += Math.min(employeeProficiency, req.requiredProficiency);

    let status: 'MATCH' | 'GAP' | 'MISSING';
    const gap = Math.max(0, req.requiredProficiency - employeeProficiency);

    if (employeeProficiency >= req.requiredProficiency) {
      status = 'MATCH';
    } else if (employeeProficiency > 0) {
      status = 'GAP';
    } else {
      status = 'MISSING';
    }

    skillsList.push({
      skillId: req.skillId,
      skillName,
      category,
      status,
      requiredProficiency: req.requiredProficiency,
      employeeProficiency,
      gap,
      verified: isVerified,
      evidenceCount: skillEvidences.length,
      evidence: skillEvidences.map(e => ({
        id: e._id,
        type: e.type,
        title: e.title,
        score: e.score,
        fileUrl: e.fileUrl,
        verified: e.verified,
        createdAt: e.createdAt || new Date().toISOString(),
      })),
    });
  }

  const readinessPercentage =
    sumRequired > 0 ? Math.round((sumAchieved / sumRequired) * 100) : 100;

  let readinessStatus: 'READY' | 'NEAR_READY' | 'NEEDS_DEVELOPMENT' = 'READY';
  if (readinessPercentage < 60) {
    readinessStatus = 'NEEDS_DEVELOPMENT';
  } else if (readinessPercentage < 85) {
    readinessStatus = 'NEAR_READY';
  }

  const matchedSkills = skillsList.filter(s => s.status === 'MATCH');
  const gapSkills = skillsList.filter(s => s.status === 'GAP');
  const missingSkills = skillsList.filter(s => s.status === 'MISSING');

  let recommendationSummary = '';
  if (missingSkills.length > 0) {
    recommendationSummary = `Priority focus on missing competencies: ${missingSkills.map(s => s.skillName).join(', ')}.`;
  } else if (gapSkills.length > 0) {
    recommendationSummary = `Skill level advancement needed in: ${gapSkills.map(s => `${s.skillName} (+${s.gap} pts)`).join(', ')}.`;
  } else {
    recommendationSummary = `All required proficiencies satisfied with verified evidence.`;
  }

  return {
    employeeId: user._id,
    employeeName: user.name,
    targetType,
    targetId,
    targetName,
    targetDescription,
    readinessPercentage,
    status: readinessStatus,
    totalRequiredSkills: requiredSkills.length,
    matchedSkillsCount: matchedSkills.length,
    gapSkillsCount: gapSkills.length,
    missingSkillsCount: missingSkills.length,
    skills: skillsList,
    matchedSkills,
    gapSkills,
    missingSkills,
    recommendationSummary,
  };
}
