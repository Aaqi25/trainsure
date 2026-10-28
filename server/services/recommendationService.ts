import {
  UserModel,
  RoleModel,
  SkillModel,
  EmployeeSkillModel,
  LearningResourceModel,
  ILearningResource,
} from '../models/index.ts';

export interface RecommendedResourceItem {
  resourceId: string;
  title: string;
  description: string;
  skillId: string;
  skillName: string;
  type: string;
  difficulty: string;
  duration: string;
  url: string;
  provider: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function getLearningRecommendationsForEmployee(
  employeeId: string
): Promise<{
  employeeId: string;
  employeeName: string;
  recommendations: RecommendedResourceItem[];
  gapSkillsIdentified: string[];
}> {
  const user = await UserModel.findById(employeeId);
  if (!user) {
    throw new Error('Employee not found');
  }

  // Find user's current skills
  const empSkills = await EmployeeSkillModel.find({ employeeId });
  const allSkills = await SkillModel.find();
  const allResources = await LearningResourceModel.find();

  // Find user's target role requirements based on jobTitle
  const roles = await RoleModel.find();
  const matchedRole = roles.find(
    r => r.name.toLowerCase() === (user.jobTitle || '').toLowerCase()
  ) || roles[0]; // fallback to first role if specific not found

  const recommendations: RecommendedResourceItem[] = [];
  const gapSkillsIdentified: string[] = [];

  if (matchedRole && matchedRole.requiredSkills) {
    for (const req of matchedRole.requiredSkills) {
      const skill = allSkills.find(s => s._id === req.skillId);
      const skillName = skill ? skill.name : 'Target Skill';

      const empSkill = empSkills.find(s => s.skillId === req.skillId);
      const currentProf = empSkill ? empSkill.proficiency : 0;

      if (currentProf < req.requiredProficiency) {
        gapSkillsIdentified.push(skillName);
        const gap = req.requiredProficiency - currentProf;

        // Find matching resources for this skill
        const matchedResources = allResources.filter(r => r.skillId === req.skillId);

        for (const res of matchedResources) {
          let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
          let reason = '';

          if (currentProf === 0) {
            priority = 'HIGH';
            reason = `Critical foundation needed: You currently have 0% proficiency in ${skillName}, while your role (${matchedRole.name}) requires ${req.requiredProficiency}%.`;
          } else {
            priority = gap >= 30 ? 'HIGH' : 'MEDIUM';
            reason = `Proficiency gap of ${gap} points in ${skillName} (Current: ${currentProf}%, Required: ${req.requiredProficiency}%).`;
          }

          recommendations.push({
            resourceId: res._id,
            title: res.title,
            description: res.description,
            skillId: req.skillId,
            skillName,
            type: res.type,
            difficulty: res.difficulty,
            duration: res.duration,
            url: res.url,
            provider: res.provider,
            reason,
            priority,
          });
        }
      }
    }
  }

  // If recommendations are fewer than 3, add general skill advancement resources
  if (recommendations.length < 3) {
    const remainingResources = allResources.filter(
      r => !recommendations.some(rec => rec.resourceId === r._id)
    );
    for (const res of remainingResources.slice(0, 3 - recommendations.length)) {
      const skill = allSkills.find(s => s._id === res.skillId);
      recommendations.push({
        resourceId: res._id,
        title: res.title,
        description: res.description,
        skillId: res.skillId,
        skillName: skill ? skill.name : 'Professional Skill',
        type: res.type,
        difficulty: res.difficulty,
        duration: res.duration,
        url: res.url,
        provider: res.provider,
        reason: 'Recommended for continuous professional skill development and career path readiness.',
        priority: 'LOW',
      });
    }
  }

  return {
    employeeId: user._id,
    employeeName: user.name,
    recommendations,
    gapSkillsIdentified,
  };
}
