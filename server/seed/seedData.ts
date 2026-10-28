import bcrypt from 'bcryptjs';
import {
  UserModel,
  DepartmentModel,
  TrainingModel,
  TrainingAssignmentModel,
  AssessmentModel,
  AssessmentAttemptModel,
  CertificationModel,
  EmployeeCertificationModel,
  ComplianceRequirementModel,
  SkillModel,
  EmployeeSkillModel,
  EvidenceModel,
  RoleModel,
  ProjectModel,
  LearningResourceModel,
  NotificationModel,
  AuditLogModel,
} from '../models/index.ts';

export async function seedDatabase(force = false) {
  const existingUsers = await UserModel.countDocuments();
  const adminExists = await UserModel.findOne({ email: 'admin@trainsure.internal' });
  if (existingUsers > 0 && adminExists && !force) {
    console.log('[Seed] Database already seeded with active admin. Skipping initial seed.');
    return;
  }

  console.log('[Seed] Seeding realistic workforce data for TrainSure...');

  // Clear existing collections if force
  if (force) {
    await Promise.all([
      UserModel.clear(),
      DepartmentModel.clear(),
      TrainingModel.clear(),
      TrainingAssignmentModel.clear(),
      AssessmentModel.clear(),
      AssessmentAttemptModel.clear(),
      CertificationModel.clear(),
      EmployeeCertificationModel.clear(),
      ComplianceRequirementModel.clear(),
      SkillModel.clear(),
      EmployeeSkillModel.clear(),
      EvidenceModel.clear(),
      RoleModel.clear(),
      ProjectModel.clear(),
      LearningResourceModel.clear(),
      NotificationModel.clear(),
      AuditLogModel.clear(),
    ]);
  }

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', salt);
  const managerPasswordHash = await bcrypt.hash('Manager123!', salt);
  const employeePasswordHash = await bcrypt.hash('Employee123!', salt);

  // 1. Departments
  const deptEngineering = await DepartmentModel.create({
    name: 'Engineering',
    description: 'Software development, cloud infrastructure, and QA systems.',
  });

  const deptHR = await DepartmentModel.create({
    name: 'Human Resources',
    description: 'Workforce enablement, recruitment, and organizational compliance.',
  });

  const deptOperations = await DepartmentModel.create({
    name: 'Operations',
    description: 'Business process continuity, logistics, and occupational safety.',
  });

  // 2. Admin User
  const admin = await UserModel.create({
    employeeId: 'EMP-ADM-001',
    name: 'Eleanor Vance',
    email: 'admin@trainsure.internal',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    jobTitle: 'Chief Learning Officer & VP HR',
    status: 'ACTIVE',
  });

  // 3. Managers
  const managerEng = await UserModel.create({
    employeeId: 'EMP-MGR-001',
    name: 'Marcus Brody',
    email: 'marcus.brody@trainsure.internal',
    passwordHash: managerPasswordHash,
    role: 'MANAGER',
    departmentId: deptEngineering._id,
    jobTitle: 'Director of Engineering',
    status: 'ACTIVE',
  });
  await DepartmentModel.findByIdAndUpdate(deptEngineering._id, { managerId: managerEng._id });

  const managerOps = await UserModel.create({
    employeeId: 'EMP-MGR-002',
    name: 'Sophia Thorne',
    email: 'sophia.thorne@trainsure.internal',
    passwordHash: managerPasswordHash,
    role: 'MANAGER',
    departmentId: deptOperations._id,
    jobTitle: 'Operations & Compliance Manager',
    status: 'ACTIVE',
  });
  await DepartmentModel.findByIdAndUpdate(deptOperations._id, { managerId: managerOps._id });

  // 4. Employees (8 employees across Engineering, HR, Ops)
  const empRahul = await UserModel.create({
    employeeId: 'EMP-1001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptEngineering._id,
    managerId: managerEng._id,
    jobTitle: 'Backend Developer',
    status: 'ACTIVE',
  });

  const empElena = await UserModel.create({
    employeeId: 'EMP-1002',
    name: 'Elena Rostova',
    email: 'elena.rostova@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptEngineering._id,
    managerId: managerEng._id,
    jobTitle: 'Full Stack Developer',
    status: 'ACTIVE',
  });

  const empDevon = await UserModel.create({
    employeeId: 'EMP-1003',
    name: 'Devon Lee',
    email: 'devon.lee@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptEngineering._id,
    managerId: managerEng._id,
    jobTitle: 'Junior Software Engineer',
    status: 'ACTIVE',
  });

  const empAmara = await UserModel.create({
    employeeId: 'EMP-1004',
    name: 'Amara Diallo',
    email: 'amara.diallo@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptHR._id,
    managerId: admin._id,
    jobTitle: 'People Operations Specialist',
    status: 'ACTIVE',
  });

  const empCarlos = await UserModel.create({
    employeeId: 'EMP-1005',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptOperations._id,
    managerId: managerOps._id,
    jobTitle: 'Facilities & Logistics Lead',
    status: 'ACTIVE',
  });

  const empPriya = await UserModel.create({
    employeeId: 'EMP-1006',
    name: 'Priya Patel',
    email: 'priya.patel@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptEngineering._id,
    managerId: managerEng._id,
    jobTitle: 'Backend Developer',
    status: 'ACTIVE',
  });

  const empLucas = await UserModel.create({
    employeeId: 'EMP-1007',
    name: 'Lucas Dupont',
    email: 'lucas.dupont@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptOperations._id,
    managerId: managerOps._id,
    jobTitle: 'Safety Coordinator',
    status: 'ACTIVE',
  });

  const empZoe = await UserModel.create({
    employeeId: 'EMP-1008',
    name: 'Zoe Jenkins',
    email: 'zoe.jenkins@trainsure.internal',
    passwordHash: employeePasswordHash,
    role: 'EMPLOYEE',
    departmentId: deptHR._id,
    managerId: admin._id,
    jobTitle: 'HR Compliance Officer',
    status: 'ACTIVE',
  });

  // 5. Skills Catalog
  const skillJS = await SkillModel.create({
    name: 'JavaScript',
    category: 'Programming',
    description: 'Modern ECMAScript, asynchronous programming, closures, and browser APIs.',
  });
  const skillReact = await SkillModel.create({
    name: 'React',
    category: 'Frontend',
    description: 'Component lifecycle, hooks, state management, and modern client architecture.',
  });
  const skillNode = await SkillModel.create({
    name: 'Node.js',
    category: 'Backend',
    description: 'Event-driven server runtime, Streams, Buffers, clustering, and worker threads.',
  });
  const skillExpress = await SkillModel.create({
    name: 'Express.js',
    category: 'Backend',
    description: 'RESTful API routing, middleware pipelines, error handling, and security headers.',
  });
  const skillMongo = await SkillModel.create({
    name: 'MongoDB',
    category: 'Database',
    description: 'Document database schema modeling, aggregation pipelines, and indexing.',
  });
  const skillDocker = await SkillModel.create({
    name: 'Docker',
    category: 'DevOps',
    description: 'Containerization, multi-stage Dockerfiles, networking, and volumes.',
  });
  const skillRest = await SkillModel.create({
    name: 'REST APIs',
    category: 'Architecture',
    description: 'API design standards, idempotency, HTTP status codes, and OAS/Swagger specs.',
  });
  const skillPython = await SkillModel.create({
    name: 'Python',
    category: 'Programming',
    description: 'Data manipulation, scripting, backend frameworks, and typing.',
  });
  const skillSQL = await SkillModel.create({
    name: 'SQL',
    category: 'Database',
    description: 'Relational queries, ACID transactions, relational normalization, and joins.',
  });
  const skillSecurity = await SkillModel.create({
    name: 'Information Security',
    category: 'Security',
    description: 'OWASP top 10 prevention, cryptography, secure token handling, and zero trust.',
  });

  // 6. Roles with Required Skills
  await RoleModel.create({
    name: 'Backend Developer',
    description: 'Builds secure, scalable server microservices and relational/document databases.',
    requiredSkills: [
      { skillId: skillNode._id, requiredProficiency: 75 },
      { skillId: skillExpress._id, requiredProficiency: 70 },
      { skillId: skillMongo._id, requiredProficiency: 65 },
      { skillId: skillRest._id, requiredProficiency: 75 },
      { skillId: skillDocker._id, requiredProficiency: 50 },
    ],
  });

  await RoleModel.create({
    name: 'Full Stack Developer',
    description: 'Architects end-to-end web applications with modern frontend and robust backend services.',
    requiredSkills: [
      { skillId: skillJS._id, requiredProficiency: 80 },
      { skillId: skillReact._id, requiredProficiency: 75 },
      { skillId: skillNode._id, requiredProficiency: 70 },
      { skillId: skillMongo._id, requiredProficiency: 60 },
      { skillId: skillRest._id, requiredProficiency: 70 },
    ],
  });

  // 7. Projects
  await ProjectModel.create({
    name: 'Internal HR Automation',
    description: 'Automate onboarding workflows, document signing, and leave approval pipelines.',
    managerId: managerEng._id,
    status: 'ACTIVE',
    requiredSkills: [
      { skillId: skillNode._id, requiredProficiency: 70 },
      { skillId: skillMongo._id, requiredProficiency: 60 },
      { skillId: skillReact._id, requiredProficiency: 65 },
      { skillId: skillDocker._id, requiredProficiency: 50 },
      { skillId: skillRest._id, requiredProficiency: 70 },
    ],
    assignedEmployeeIds: [empRahul._id, empElena._id],
  });

  await ProjectModel.create({
    name: 'Employee Learning Portal',
    description: 'Enterprise skill matrix, continuous certification verification, and learning telemetry.',
    managerId: managerEng._id,
    status: 'PLANNING',
    requiredSkills: [
      { skillId: skillReact._id, requiredProficiency: 80 },
      { skillId: skillNode._id, requiredProficiency: 75 },
      { skillId: skillRest._id, requiredProficiency: 75 },
      { skillId: skillSecurity._id, requiredProficiency: 60 },
    ],
    assignedEmployeeIds: [empElena._id, empPriya._id],
  });

  // 8. Trainings
  const trainSec = await TrainingModel.create({
    title: 'Security Awareness & Threat Defense',
    description: 'Critical cyber hygiene: phishing prevention, credentials, device protection, and zero trust policies.',
    category: 'Security',
    instructor: 'CyberSec Operations Institute',
    duration: 3,
    difficulty: 'BEGINNER',
    mandatory: true,
    createdBy: admin._id,
    status: 'ACTIVE',
    modules: [
      {
        id: 'mod-sec-1',
        title: 'Phishing Tactics & Social Engineering',
        description: 'Identifying spear phishing, spoofed domains, and social engineering red flags.',
        content: 'Phishing is one of the most common vectors for organizational breach. Attackers craft messages impersonating executive leaders, payroll notices, or system password expirations. Always inspect sender domain headers and verify requests out-of-band.',
        durationMinutes: 45,
        order: 1,
      },
      {
        id: 'mod-sec-2',
        title: 'Authentication & Credential Hygiene',
        description: 'Multi-factor authentication (MFA), password managers, and session management.',
        content: 'Never reuse passwords across personal and enterprise systems. TrainSure requires hardware-backed or authenticator app MFA for all privileged access.',
        durationMinutes: 45,
        order: 2,
      },
      {
        id: 'mod-sec-3',
        title: 'Data Classification & Incident Escalation',
        description: 'Categorizing Confidential vs Public data and protocol for reporting suspected breaches.',
        content: 'All customer PII and internal access credentials are classified as Strictly Confidential. Immediately report anomalies to security-ops@trainsure.internal.',
        durationMinutes: 90,
        order: 3,
      },
    ],
  });

  const trainPrivacy = await TrainingModel.create({
    title: 'Data Privacy & GDPR Standards',
    description: 'Data protection principles, handling PII, user consent, and regulatory audit compliance.',
    category: 'Compliance',
    instructor: 'Legal & Regulatory Affairs',
    duration: 2,
    difficulty: 'BEGINNER',
    mandatory: true,
    createdBy: admin._id,
    status: 'ACTIVE',
    modules: [
      {
        id: 'mod-priv-1',
        title: 'Core Principles of Data Minimization',
        description: 'Collecting only data strictly necessary for processing.',
        content: 'Organizations must collect personal data for specified, explicit, and legitimate purposes and not further process it in a manner incompatible with those purposes.',
        durationMinutes: 60,
        order: 1,
      },
      {
        id: 'mod-priv-2',
        title: 'Subject Access Requests & Breach Timelines',
        description: '72-hour breach notification rules and right-to-be-forgotten execution.',
        content: 'Under GDPR Article 33, supervisory authorities must be notified within 72 hours of becoming aware of a breach that results in risk to data subjects.',
        durationMinutes: 60,
        order: 2,
      },
    ],
  });

  const trainBackend = await TrainingModel.create({
    title: 'Modern Backend Architecture with Node.js',
    description: 'Enterprise REST APIs, asynchronous performance, security middleware, and database transaction design.',
    category: 'Engineering',
    instructor: 'Principal Systems Architect',
    duration: 8,
    difficulty: 'ADVANCED',
    mandatory: false,
    createdBy: managerEng._id,
    status: 'ACTIVE',
    modules: [
      {
        id: 'mod-back-1',
        title: 'Node.js Event Loop & Non-Blocking I/O',
        description: 'Libuv, macro/micro task queues, and avoiding main thread starvation.',
        content: 'Understanding how the Event Loop coordinates async operations across timers, I/O callbacks, and check phases ensures non-blocking throughput.',
        durationMinutes: 120,
        order: 1,
      },
      {
        id: 'mod-back-2',
        title: 'Middleware Architecture & Resilient Error Handling',
        description: 'Express pipeline design, centralized error handling, and input validation with schemas.',
        content: 'Clean architecture dictates controllers remain thin, business logic stays in services, and errors bubble up to standard error-handling middleware.',
        durationMinutes: 150,
        order: 2,
      },
      {
        id: 'mod-back-3',
        title: 'Database Transactions & Connection Pooling',
        description: 'Concurrency control, ACID compliance in MongoDB/SQL, and query performance.',
        content: 'Proper connection management and atomic operations prevent race conditions and connection exhaustion under high concurrency loads.',
        durationMinutes: 210,
        order: 3,
      },
    ],
  });

  const trainSafety = await TrainingModel.create({
    title: 'Workplace Safety & Emergency Protocols',
    description: 'OSHA guidelines, hazard identification, evacuation procedures, and emergency response.',
    category: 'Safety',
    instructor: 'EHS Department',
    duration: 2,
    difficulty: 'BEGINNER',
    mandatory: true,
    createdBy: managerOps._id,
    status: 'ACTIVE',
    modules: [
      {
        id: 'mod-safe-1',
        title: 'Hazard Identification & Incident Reporting',
        description: 'Recognizing physical, electrical, and ergonomic workplace hazards.',
        content: 'Proactive hazard mitigation prevents injuries. Every employee is empowered with stop-work authority when safety standards are breached.',
        durationMinutes: 60,
        order: 1,
      },
      {
        id: 'mod-safe-2',
        title: 'Emergency Evacuation & Fire Response',
        description: 'Alarm triggers, assembly locations, and role of designated marshals.',
        content: 'Maintain unblocked exit routes at all times. Familiarize yourself with primary and secondary emergency exits in your operational wing.',
        durationMinutes: 60,
        order: 2,
      },
    ],
  });

  // 9. Assessments for Trainings
  const assessSec = await AssessmentModel.create({
    trainingId: trainSec._id,
    title: 'Security Awareness Certification Exam',
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        id: 'q-sec-1',
        question: 'An urgent email arrives from "exec-payroll-update@secure-hr-notice.net" requesting instant login to review your W-2. What is the correct action?',
        options: [
          'Click the link and login quickly to verify the document',
          'Forward the email to all colleagues to warn them',
          'Do not click any link, report to security-ops, and inspect the anomalous external domain',
          'Reply to the email asking for confirmation of identity',
        ],
        correctAnswer: 2,
        marks: 25,
      },
      {
        id: 'q-sec-2',
        question: 'What is the most secure method for Multi-Factor Authentication (MFA)?',
        options: [
          'SMS-based text codes',
          'Hardware security keys (FIDO2/WebAuthn) or time-based authenticator apps (TOTP)',
          'Emailing verification codes to a personal inbox',
          'Security questions such as mother maiden name',
        ],
        correctAnswer: 1,
        marks: 25,
      },
      {
        id: 'q-sec-3',
        question: 'Under zero-trust architecture, how is internal network traffic handled?',
        options: [
          'All devices inside the corporate Wi-Fi are automatically trusted',
          'Every request must authenticate, authorize, and encrypt regardless of network location',
          'Firewalls only filter external traffic; internal traffic is uninspected',
          'Only database servers require credentials',
        ],
        correctAnswer: 1,
        marks: 25,
      },
      {
        id: 'q-sec-4',
        question: 'You discover an unencrypted file containing customer PII in a shared public folder. What must you do?',
        options: [
          'Delete it quietly without telling anyone',
          'Report it immediately to the security team and data protection officer',
          'Copy it to your desktop for safekeeping',
          'Ignore it if nobody else has noticed',
        ],
        correctAnswer: 1,
        marks: 25,
      },
    ],
  });

  const assessBack = await AssessmentModel.create({
    trainingId: trainBackend._id,
    title: 'Node.js Backend Architectural Competency Exam',
    passingScore: 75,
    timeLimit: 25,
    questions: [
      {
        id: 'q-b-1',
        question: 'Which Node.js phase processes microtasks like process.nextTick and Promise resolutions?',
        options: [
          'Only after the close callbacks phase completes',
          'Immediately after each individual callback or event phase finishes, before continuing',
          'Exclusively in the timer phase',
          'Inside the libuv threadpool asynchronously',
        ],
        correctAnswer: 1,
        marks: 30,
      },
      {
        id: 'q-b-2',
        question: 'Why should Express asynchronous route handlers catch errors or pass them via next(err)?',
        options: [
          'To boost CPU core clock speed',
          'To prevent unhandled promise rejections from leaking memory or crashing the process',
          'Because HTTP standards prohibit try/catch blocks',
          'It is purely decorative syntax',
        ],
        correctAnswer: 1,
        marks: 35,
      },
      {
        id: 'q-b-3',
        question: 'What is the primary benefit of streaming large file responses in Node.js instead of fs.readFileSync?',
        options: [
          'Streams eliminate network latency completely',
          'Streams buffer chunks progressively, maintaining minimal memory footprint regardless of file size',
          'Streams automatically compress files to zero bytes',
          'fs.readFileSync is deprecated in Node v20+',
        ],
        correctAnswer: 1,
        marks: 35,
      },
    ],
  });

  // 10. Certifications Catalog
  const certSecPlus = await CertificationModel.create({
    name: 'CompTIA Security+',
    issuer: 'CompTIA',
    validityPeriod: 36, // 3 years
    description: 'Global benchmark for foundational cybersecurity practitioner skills.',
    category: 'Security',
  });

  const certMongoDev = await CertificationModel.create({
    name: 'MongoDB Certified Developer Associate',
    issuer: 'MongoDB Inc.',
    validityPeriod: 24, // 2 years
    description: 'Validates proficiency in MongoDB document modeling, queries, and aggregations.',
    category: 'Database',
  });

  const certAwsArch = await CertificationModel.create({
    name: 'AWS Solutions Architect Associate',
    issuer: 'Amazon Web Services',
    validityPeriod: 36,
    description: 'Design resilient, high-performing, and cost-effective cloud architectures.',
    category: 'Cloud',
  });

  const certFirstAid = await CertificationModel.create({
    name: 'First Aid & CPR / AED Specialist',
    issuer: 'National Safety Council',
    validityPeriod: 24,
    description: 'Certified emergency medical first response and workplace safety compliance.',
    category: 'Safety',
  });

  // 11. Compliance Requirements
  const compReqSec = await ComplianceRequirementModel.create({
    title: 'Annual Enterprise Cybersecurity Hygiene',
    description: 'Mandatory annual completion of Security Awareness training for all personnel.',
    type: 'TRAINING',
    targetTrainingId: trainSec._id,
    appliesToAll: true,
    frequency: 'ANNUAL',
    gracePeriodDays: 14,
  });

  const compReqPrivacy = await ComplianceRequirementModel.create({
    title: 'GDPR & Data Protection Regulatory Compliance',
    description: 'All HR and Engineering staff must maintain active certification in Data Privacy.',
    type: 'TRAINING',
    targetTrainingId: trainPrivacy._id,
    appliesToAll: true,
    frequency: 'ANNUAL',
    gracePeriodDays: 10,
  });

  const compReqSafety = await ComplianceRequirementModel.create({
    title: 'Operations Workplace Safety Mandate',
    description: 'Operations and facilities personnel must complete occupational hazard safety.',
    type: 'TRAINING',
    targetTrainingId: trainSafety._id,
    targetDepartmentId: deptOperations._id,
    appliesToAll: false,
    frequency: 'ANNUAL',
    gracePeriodDays: 7,
  });

  const compReqFirstAid = await ComplianceRequirementModel.create({
    title: 'Emergency Response First Aid Certification',
    description: 'Designated Safety Coordinators must hold verified active First Aid credentials.',
    type: 'CERTIFICATION',
    targetCertificationId: certFirstAid._id,
    targetRole: 'Safety Coordinator',
    appliesToAll: false,
    frequency: 'BIENNIAL',
    gracePeriodDays: 30,
  });

  // 12. Seed Training Assignments with Realistic Demo States:
  // - Completed
  // - In-Progress
  // - Overdue
  const pastDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const recentDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const futureDueDate = new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString();
  const overdueDate = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
  const urgentDueDate = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();

  // Rahul: COMPLETED Security Awareness (100%), IN_PROGRESS Node Backend (66%), ASSIGNED Data Privacy
  await TrainingAssignmentModel.create({
    employeeId: empRahul._id,
    trainingId: trainSec._id,
    assignedBy: managerEng._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    progress: 100,
    completedModules: ['mod-sec-1', 'mod-sec-2', 'mod-sec-3'],
    completedAt: recentDate,
  });

  await TrainingAssignmentModel.create({
    employeeId: empRahul._id,
    trainingId: trainBackend._id,
    assignedBy: managerEng._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    progress: 66,
    completedModules: ['mod-back-1', 'mod-back-2'],
  });

  await TrainingAssignmentModel.create({
    employeeId: empRahul._id,
    trainingId: trainPrivacy._id,
    assignedBy: admin._id,
    assignedDate: recentDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'ASSIGNED',
    progress: 0,
    completedModules: [],
  });

  // Elena: COMPLETED Security + COMPLETED Data Privacy + COMPLETED Backend (Top Performer)
  await TrainingAssignmentModel.create({
    employeeId: empElena._id,
    trainingId: trainSec._id,
    assignedBy: managerEng._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    progress: 100,
    completedModules: ['mod-sec-1', 'mod-sec-2', 'mod-sec-3'],
    completedAt: pastDate,
  });

  await TrainingAssignmentModel.create({
    employeeId: empElena._id,
    trainingId: trainPrivacy._id,
    assignedBy: admin._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    progress: 100,
    completedModules: ['mod-priv-1', 'mod-priv-2'],
    completedAt: recentDate,
  });

  // Devon: OVERDUE Security Awareness (Status: OVERDUE)
  await TrainingAssignmentModel.create({
    employeeId: empDevon._id,
    trainingId: trainSec._id,
    assignedBy: managerEng._id,
    assignedDate: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    dueDate: overdueDate,
    priority: 'HIGH',
    status: 'OVERDUE',
    progress: 33,
    completedModules: ['mod-sec-1'],
  });

  // Amara (HR): COMPLETED Data Privacy, IN_PROGRESS Security
  await TrainingAssignmentModel.create({
    employeeId: empAmara._id,
    trainingId: trainPrivacy._id,
    assignedBy: admin._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    progress: 100,
    completedModules: ['mod-priv-1', 'mod-priv-2'],
    completedAt: recentDate,
  });
  await TrainingAssignmentModel.create({
    employeeId: empAmara._id,
    trainingId: trainSec._id,
    assignedBy: admin._id,
    assignedDate: pastDate,
    dueDate: urgentDueDate,
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    progress: 66,
    completedModules: ['mod-sec-1', 'mod-sec-2'],
  });

  // Carlos (Ops): COMPLETED Workplace Safety
  await TrainingAssignmentModel.create({
    employeeId: empCarlos._id,
    trainingId: trainSafety._id,
    assignedBy: managerOps._id,
    assignedDate: pastDate,
    dueDate: futureDueDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    progress: 100,
    completedModules: ['mod-safe-1', 'mod-safe-2'],
    completedAt: recentDate,
  });

  // Lucas (Safety Coordinator): OVERDUE Safety + Expired First Aid
  await TrainingAssignmentModel.create({
    employeeId: empLucas._id,
    trainingId: trainSafety._id,
    assignedBy: managerOps._id,
    assignedDate: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    dueDate: overdueDate,
    priority: 'HIGH',
    status: 'OVERDUE',
    progress: 50,
    completedModules: ['mod-safe-1'],
  });

  // 13. Assessment Attempts
  // Rahul scored 100% on Security Assessment
  await AssessmentAttemptModel.create({
    assessmentId: assessSec._id,
    employeeId: empRahul._id,
    answers: [
      { questionId: 'q-sec-1', selectedOption: 2, isCorrect: true, marksEarned: 25 },
      { questionId: 'q-sec-2', selectedOption: 1, isCorrect: true, marksEarned: 25 },
      { questionId: 'q-sec-3', selectedOption: 1, isCorrect: true, marksEarned: 25 },
      { questionId: 'q-sec-4', selectedOption: 1, isCorrect: true, marksEarned: 25 },
    ],
    score: 100,
    earnedMarks: 100,
    totalMarks: 100,
    passed: true,
    attemptedAt: recentDate,
  });

  // Elena scored 100% on Node Backend
  await AssessmentAttemptModel.create({
    assessmentId: assessBack._id,
    employeeId: empElena._id,
    answers: [
      { questionId: 'q-b-1', selectedOption: 1, isCorrect: true, marksEarned: 30 },
      { questionId: 'q-b-2', selectedOption: 1, isCorrect: true, marksEarned: 35 },
      { questionId: 'q-b-3', selectedOption: 1, isCorrect: true, marksEarned: 35 },
    ],
    score: 100,
    earnedMarks: 100,
    totalMarks: 100,
    passed: true,
    attemptedAt: recentDate,
  });

  // 14. Employee Certifications with Realistic States:
  // - ACTIVE
  // - EXPIRING_SOON (<= 30 days)
  // - EXPIRED (<= 0 days)
  const activeExpiry = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const expiringSoonDate = new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString();
  const expiredDate = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();

  // Rahul: MongoDB Developer (Active, Verified)
  await EmployeeCertificationModel.create({
    employeeId: empRahul._id,
    certificationId: certMongoDev._id,
    certificateNumber: 'MDB-DEV-882914',
    issueDate: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(),
    expiryDate: activeExpiry,
    fileUrl: '/uploads/cert_mongodb_rahul.pdf',
    fileName: 'cert_mongodb_rahul.pdf',
    verified: true,
    verifiedBy: managerEng._id,
    verifiedAt: recentDate,
    status: 'ACTIVE',
  });

  // Elena: AWS Solutions Architect (Active, Verified) + CompTIA Security+ (Expiring soon)
  await EmployeeCertificationModel.create({
    employeeId: empElena._id,
    certificationId: certAwsArch._id,
    certificateNumber: 'AWS-ARCH-99014',
    issueDate: pastDate,
    expiryDate: activeExpiry,
    fileUrl: '/uploads/cert_aws_elena.pdf',
    fileName: 'cert_aws_elena.pdf',
    verified: true,
    verifiedBy: managerEng._id,
    status: 'ACTIVE',
  });

  await EmployeeCertificationModel.create({
    employeeId: empElena._id,
    certificationId: certSecPlus._id,
    certificateNumber: 'SEC-PLUS-55109',
    issueDate: new Date(Date.now() - 1000 * 24 * 3600 * 1000).toISOString(),
    expiryDate: expiringSoonDate,
    fileUrl: '/uploads/cert_sec_elena.pdf',
    fileName: 'cert_sec_elena.pdf',
    verified: true,
    verifiedBy: admin._id,
    status: 'EXPIRING_SOON',
  });

  // Lucas: First Aid (EXPIRED!) -> Triggers NON_COMPLIANT / AT_RISK state
  await EmployeeCertificationModel.create({
    employeeId: empLucas._id,
    certificationId: certFirstAid._id,
    certificateNumber: 'FA-CPR-10492',
    issueDate: new Date(Date.now() - 740 * 24 * 3600 * 1000).toISOString(),
    expiryDate: expiredDate,
    fileUrl: '/uploads/cert_firstaid_lucas.pdf',
    fileName: 'cert_firstaid_lucas.pdf',
    verified: true,
    verifiedBy: managerOps._id,
    status: 'EXPIRED',
  });

  // 15. Skills, Evidence & Employee Skills
  // Rahul: Node.js (80), MongoDB (75), Express (70), REST APIs (80), Docker (30) -> Gap in Docker!
  const evRahulNode1 = await EvidenceModel.create({
    employeeId: empRahul._id,
    skillId: skillNode._id,
    type: 'TRAINING',
    title: 'Completed Advanced Node.js Architecture Coursework',
    description: 'Passed asynchronous event-loop and stream pipeline labs.',
    score: 90,
    verified: true,
    verifiedBy: managerEng._id,
  });

  const evRahulMongo1 = await EvidenceModel.create({
    employeeId: empRahul._id,
    skillId: skillMongo._id,
    type: 'CERTIFICATION',
    title: 'MongoDB Certified Developer Associate Proof',
    description: 'Official credential verified on MongoDB registry.',
    score: 88,
    verified: true,
    verifiedBy: managerEng._id,
  });

  const evRahulRest1 = await EvidenceModel.create({
    employeeId: empRahul._id,
    skillId: skillRest._id,
    type: 'PROJECT',
    title: 'Built Resilient Public REST Gateway',
    description: 'Designed OpenAPI 3.0 specification with rate limiting and idempotent keys.',
    score: 85,
    verified: true,
    verifiedBy: managerEng._id,
  });

  await EmployeeSkillModel.create({
    employeeId: empRahul._id,
    skillId: skillNode._id,
    proficiency: 80,
    evidenceIds: [evRahulNode1._id],
    verified: true,
    verifiedBy: managerEng._id,
  });

  await EmployeeSkillModel.create({
    employeeId: empRahul._id,
    skillId: skillMongo._id,
    proficiency: 75,
    evidenceIds: [evRahulMongo1._id],
    verified: true,
    verifiedBy: managerEng._id,
  });

  await EmployeeSkillModel.create({
    employeeId: empRahul._id,
    skillId: skillExpress._id,
    proficiency: 70,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });

  await EmployeeSkillModel.create({
    employeeId: empRahul._id,
    skillId: skillRest._id,
    proficiency: 80,
    evidenceIds: [evRahulRest1._id],
    verified: true,
    verifiedBy: managerEng._id,
  });

  await EmployeeSkillModel.create({
    employeeId: empRahul._id,
    skillId: skillDocker._id,
    proficiency: 30, // Gap! Backend role requires 50
    evidenceIds: [],
    verified: false,
  });

  // Elena: Top-tier skills (Node: 85, React: 85, JS: 90, Mongo: 75, REST: 85)
  await EmployeeSkillModel.create({
    employeeId: empElena._id,
    skillId: skillJS._id,
    proficiency: 90,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });
  await EmployeeSkillModel.create({
    employeeId: empElena._id,
    skillId: skillReact._id,
    proficiency: 85,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });
  await EmployeeSkillModel.create({
    employeeId: empElena._id,
    skillId: skillNode._id,
    proficiency: 85,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });
  await EmployeeSkillModel.create({
    employeeId: empElena._id,
    skillId: skillMongo._id,
    proficiency: 75,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });
  await EmployeeSkillModel.create({
    employeeId: empElena._id,
    skillId: skillRest._id,
    proficiency: 85,
    evidenceIds: [],
    verified: true,
    verifiedBy: managerEng._id,
  });

  // 16. Learning Resources (Catalogs for Rule-Based Recommendations)
  await LearningResourceModel.create({
    title: 'Docker Fundamentals & Containerization Mastery',
    description: 'Learn Docker images, multi-stage builds, container isolation, and Compose networking.',
    skillId: skillDocker._id,
    type: 'COURSE',
    difficulty: 'BEGINNER',
    duration: '4 hours',
    url: 'https://trainsure.internal/learning/docker-fundamentals',
    provider: 'TrainSure Academy',
  });

  await LearningResourceModel.create({
    title: 'Docker Compose & Production Orchestration Patterns',
    description: 'Multi-service container setups, healthchecks, volume persistence, and secret handling.',
    skillId: skillDocker._id,
    type: 'LAB',
    difficulty: 'INTERMEDIATE',
    duration: '3 hours',
    url: 'https://trainsure.internal/learning/docker-compose-patterns',
    provider: 'DevOps Training Lab',
  });

  await LearningResourceModel.create({
    title: 'Production REST API Design & Performance Guide',
    description: 'RFC standards, pagination, filtering, caching strategies, and security headers.',
    skillId: skillRest._id,
    type: 'DOCUMENTATION',
    difficulty: 'INTERMEDIATE',
    duration: '2 hours',
    url: 'https://trainsure.internal/learning/rest-api-design',
    provider: 'TrainSure Engineering',
  });

  await LearningResourceModel.create({
    title: 'MongoDB Aggregation Framework Deep Dive',
    description: 'Pipeline operators, lookup joins, facet grouping, and query profiling.',
    skillId: skillMongo._id,
    type: 'WORKSHOP',
    difficulty: 'ADVANCED',
    duration: '5 hours',
    url: 'https://trainsure.internal/learning/mongodb-aggregation',
    provider: 'Database Practice Group',
  });

  await LearningResourceModel.create({
    title: 'Secure Coding & OWASP Top 10 Defense in Node.js',
    description: 'Injection mitigation, rate limiting, helmet configuration, and CSRF protection.',
    skillId: skillSecurity._id,
    type: 'COURSE',
    difficulty: 'INTERMEDIATE',
    duration: '3.5 hours',
    url: 'https://trainsure.internal/learning/owasp-defense-node',
    provider: 'InfoSec Engineering Team',
  });

  // 17. Seed Initial Notifications
  await NotificationModel.create({
    recipientId: empRahul._id,
    type: 'TRAINING_ASSIGNED',
    title: 'New Training Assigned: Data Privacy & GDPR',
    message: 'You have been enrolled in Data Privacy & GDPR Standards. Due in 21 days.',
    read: false,
    link: '/training',
  });

  await NotificationModel.create({
    recipientId: empElena._id,
    type: 'CERTIFICATION_EXPIRING',
    title: 'CompTIA Security+ Expiring Soon',
    message: 'Your CompTIA Security+ certification will expire in 18 days. Please prepare renewal.',
    read: false,
    link: '/certifications',
  });

  await NotificationModel.create({
    recipientId: empLucas._id,
    type: 'CERTIFICATION_EXPIRED',
    title: 'First Aid & CPR Certification Expired',
    message: 'Your certification expired 15 days ago. Immediate recertification required for safety compliance.',
    read: false,
    link: '/certifications',
  });

  await NotificationModel.create({
    recipientId: empDevon._id,
    type: 'TRAINING_OVERDUE',
    title: 'Security Awareness Course Overdue',
    message: 'Your assignment is 4 days overdue. Please complete required modules immediately.',
    read: false,
    link: '/training',
  });

  // 18. Audit Logs
  await AuditLogModel.create({
    actorId: admin._id,
    actorName: admin.name,
    actorRole: 'ADMIN',
    action: 'CREATE_TRAINING',
    entity: 'Training',
    entityId: trainSec._id,
    timestamp: pastDate,
    details: { title: trainSec.title, mandatory: true },
  });

  await AuditLogModel.create({
    actorId: managerEng._id,
    actorName: managerEng.name,
    actorRole: 'MANAGER',
    action: 'VERIFY_EVIDENCE',
    entity: 'Evidence',
    entityId: evRahulMongo1._id,
    timestamp: recentDate,
    details: { employeeName: 'Rahul Sharma', skillName: 'MongoDB', score: 88 },
  });

  console.log('[Seed] Database successfully seeded with 1 Admin, 2 Managers, 8 Employees, and all related modules.');
}


export async function ensureDemoAccounts(): Promise<void> {
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin123!', salt);
  const managerHash = await bcrypt.hash('Manager123!', salt);
  const employeeHash = await bcrypt.hash('Employee123!', salt);

  let admin = await UserModel.findOne({ email: 'admin@trainsure.internal' });
  if (!admin) {
    admin = await UserModel.create({
      employeeId: 'EMP-ADM-001',
      name: 'Eleanor Vance',
      email: 'admin@trainsure.internal',
      passwordHash: adminHash,
      role: 'ADMIN',
      jobTitle: 'Chief Learning Officer & VP HR',
      status: 'ACTIVE',
    });
  }

  let mgr = await UserModel.findOne({ email: 'marcus.brody@trainsure.internal' });
  if (!mgr) {
    mgr = await UserModel.create({
      employeeId: 'EMP-MGR-001',
      name: 'Marcus Brody',
      email: 'marcus.brody@trainsure.internal',
      passwordHash: managerHash,
      role: 'MANAGER',
      jobTitle: 'Director of Engineering',
      status: 'ACTIVE',
    });
  }

  let emp = await UserModel.findOne({ email: 'rahul.sharma@trainsure.internal' });
  if (!emp) {
    emp = await UserModel.create({
      employeeId: 'EMP-1001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@trainsure.internal',
      passwordHash: employeeHash,
      role: 'EMPLOYEE',
      jobTitle: 'Backend Developer',
      status: 'ACTIVE',
    });
  }
}
