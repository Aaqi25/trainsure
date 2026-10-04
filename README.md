# TrainSure

> **Train. Track. Certify. Comply. Grow.**
>
> **Intelligent Employee Training, Skills & Compliance Management Platform**

---

## 1. Product Overview

**TrainSure** is a production-grade full-stack workforce capability platform (MERN architecture: MongoDB, Express.js, React, Node.js). 

While traditional Learning Management Systems (LMS) only track whether a course was completed, TrainSure establishes a bidirectional workforce intelligence pipeline:

```text
Training → Assessment → Certification → Validity → Renewal → Compliance → Risk
                              and
Learning → Evidence → Skills → Skill Gaps → Learning Recommendations → Readiness
```

TrainSure enables organizations to govern regulatory compliance, track time-sensitive certification expirations, maintain an evidence-backed skill taxonomy, analyze competency gaps against job roles and project staffing, and deliver targeted learning recommendations.

---

## 2. Problem Statement

Modern enterprise organizations struggle with fragmented HR systems, spreadsheets, and disconnected course catalogs. This causes:
- Overlooked certification expirations exposing organizations to legal and regulatory penalties.
- Non-verifiable skill claims without tangible proof artifacts.
- Inability to determine whether employees are qualified for upcoming roles or project deliverables.
- Late detection of compliance risks and missed deadlines.
- Disconnected training that fails to address strategic workforce skill gaps.

TrainSure solves these problems through an integrated modular monolith that links coursework, assessments, and certifications to verifiable evidence and continuous compliance audits.

---

## 3. Core Features & Capabilities

- **Role-Based Access Control (RBAC):** Three distinct roles (**ADMIN**, **MANAGER**, **EMPLOYEE**) enforced at both the API layer and the client UI.
- **Enterprise Course & Module Management:** Multi-module curriculum builder, mandatory vs. optional tags, duration, difficulty, and departmental enrollment.
- **Interactive Learning & Progress Tracking:** Real-time module progress tracking calculated on the backend (0% Assigned, 1–99% In Progress, 100% Completed), auto-minting verifiable training evidence upon completion.
- **Assessment Engine:** Timed examinations with randomized multiple-choice questions, hidden answer keys, auto-grading, pass/fail thresholds, question reviews, and automated skill evidence generation.
- **Certification Validity & Expiration Tracking:** Upload certificate credentials (PDF, JPG, PNG), track issue and expiry dates, dynamic status updates (`ACTIVE`, `EXPIRING_SOON` $\le 30$ days, `EXPIRED` $\le 0$ days), and administrative/manager verification workflows.
- **Deterministic Compliance Engine:** Regulatory mandates enforced organization-wide or filtered by department/role. Continuous calculation of `COMPLIANT`, `AT_RISK`, and `NON_COMPLIANT` states with transparent, explainable itemized factors.
- **Compliance Risk Intelligence:** Transparent rule-based risk scoring (0–100) and classification (`LOW`, `MEDIUM`, `HIGH`) factoring in expired credentials (+40), overdue training (+20), failed assessments (+15), and approaching deadlines (+15).
- **Evidence-Backed Skills Taxonomy:** Connects employee capabilities to tangible evidence artifacts (training completions, exams, project deliverables, certifications, and manager endorsements). Standardized 0–100 proficiency scale with 5 competency levels (Beginner, Basic, Intermediate, Advanced, Expert).
- **Skill Gap & Readiness Analysis:** Compare verified employee proficiencies against Job Role benchmarks and Project Staffing requirements. Categorizes each competency into `MATCH`, `GAP` (with points required), or `MISSING` (0%). Calculates overall readiness percentage.
- **Targeted Learning Recommendations:** Rule-based recommendation engine that maps identified skill gaps to catalog learning resources with explainable rationale.
- **Automated Background Jobs:** `node-cron` scheduled sweeps running daily for certification expiration detection, overdue training flagging, compliance audits, and in-app/email alerts.
- **Audit Logging:** Immutable audit trail logging actor, role, action, target entity, timestamp, and metadata.

---

## 4. User Roles & Permission Matrix

| Module / Operation | Admin | Manager | Employee |
| :--- | :---: | :---: | :---: |
| Organization & User Management | Full | Direct Team | View Profile |
| Department Configuration | Create/Edit/Delete | View Assigned | View Assigned |
| Course Management | Full Authoring | View / Assign | View Enrolled |
| Take Courses & Complete Modules | — | — | Full Access |
| Create Assessments | Full | Review Results | — |
| Take Exams & Review Answers | — | — | Full Access |
| Certification Verification | Full Verification | Team Verification | Upload Proof |
| Compliance Governance | Configure Mandates | Team Posture | Personal Audit |
| Skill Evidence Verification | Full Verification | Team Endorsement | Submit Proof |
| Role & Project Readiness | Benchmark Setup | Staffing Explorer | Personal Gap View |
| Workforce Analytics & Audit Log | Full Ledger | Team Telemetry | Personal Metrics |

---

## 5. Technology Stack

- **Frontend:**
  - React 19 (Hooks, Functional Architecture)
  - Vite 8 (Ultra-fast bundler)
  - Tailwind CSS 4 (Custom typography, responsive layouts)
  - React Router v7 (Protected routes, dynamic role redirection)
  - Axios (JWT bearer interceptors, multi-part form data uploads)
  - Recharts (Area charts, bar charts, donut charts)
  - Lucide React (Enterprise icon system)
- **Backend:**
  - Node.js (v20+ / v22)
  - Express.js (Modular routes, controllers, middleware)
  - Mongoose & MongoDB (Embedded fallback and MongoDB Atlas connectivity)
  - JWT (JSON Web Tokens with 24-hour expiration)
  - bcryptjs (Cryptographic salt hashing)
  - Multer (Safe disk storage, MIME filtering for PDF/JPG/PNG)
  - node-cron (Automated background task scheduling)
  - Nodemailer (Configurable SMTP email alerts with graceful local fallback)
- **Architecture:**
  - Modular Monolith
  - Strict separation of routes, controllers, services, middleware, and models
  - 100% database-driven analytics (Zero hardcoded metrics)

---

## 6. Project Directory Structure

```text
TrainSure/
├── server/
│   ├── config/
│   │   └── database.ts            # MongoDB / embedded collection engine
│   ├── models/
│   │   └── index.ts               # 18 Mongoose data models
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication & RBAC
│   │   ├── error.ts               # Centralized API error handling
│   │   └── upload.ts              # Multer certificate & evidence uploads
│   ├── services/
│   │   ├── complianceService.ts   # Rule-based compliance evaluation
│   │   ├── readinessService.ts    # Skill gap & readiness engine
│   │   ├── recommendationService.ts# Learning recommendations engine
│   │   ├── riskService.ts         # Compliance risk intelligence
│   │   ├── auditService.ts        # Audit log recording
│   │   ├── notificationService.ts # In-app alerts
│   │   └── emailService.ts        # Nodemailer integration
│   ├── jobs/
│   │   └── cronJobs.ts            # Scheduled background jobs (node-cron)
│   ├── controllers/               # REST API controllers
│   ├── routes/
│   │   └── api.ts                 # Main express API router
│   └── seed/
│       └── seedData.ts            # Comprehensive workforce demo dataset
├── src/
│   ├── components/
│   │   └── common/                # Navbar, Sidebar, Modal, Badges, Tables
│   ├── context/
│   │   └── AuthContext.tsx        # Authentication & persona switcher
│   ├── layouts/
│   │   └── MainLayout.tsx         # Dashboard responsive layout
│   ├── pages/
│   │   ├── auth/                  # Login & Register
│   │   ├── admin/                 # 10 Admin management & audit views
│   │   ├── manager/               # 9 Team supervision & readiness views
│   │   ├── employee/              # 10 Personal learning & evidence views
│   │   └── common/                # Notification Center
│   ├── services/
│   │   └── api.ts                 # Axios client & typed endpoints
│   ├── App.tsx                    # Route definitions & guards
│   └── main.tsx                   # React root entrypoint
├── uploads/                       # Safe storage for certificate proofs
├── data/                          # Persistent local database store
├── server.ts                      # Express + Vite full-stack server
├── package.json
└── README.md
```

---

## 7. Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
# Server Port
PORT=3000
NODE_ENV=development

# Database Connection (MongoDB Atlas or local MongoDB)
# Note: If no MongoDB is reachable, TrainSure automatically runs its embedded
# persistent data store with zero configuration!
MONGO_URI=mongodb://localhost:27017/trainsure

# JWT Authentication
JWT_SECRET=trainsure-super-secure-jwt-secret-key-2026
JWT_EXPIRES_IN=1d

# Frontend Base URL
CLIENT_URL=http://localhost:3000

# Optional SMTP Email Configuration (Nodemailer)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="TrainSure Notifications <no-reply@trainsure.internal>"
```

---

## 8. Installation & Quickstart

### Prerequisites
- Node.js v20.x or v22.x
- npm v10+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The application will start on **`http://localhost:3000`**. On first boot, TrainSure automatically seeds a realistic enterprise workforce dataset:
- **1 Admin:** Eleanor Vance (`admin@trainsure.internal` / `Admin123!`)
- **2 Managers:** Marcus Brody (`marcus.brody@trainsure.internal` / `Manager123!`), Sophia Thorne (`sophia.thorne@trainsure.internal` / `Manager123!`)
- **8 Employees:** Rahul Sharma, Elena Rostova, Devon Lee, Amara Diallo, Carlos Mendoza, Priya Patel, Lucas Dupont, Zoe Jenkins (`Employee123!`)
- Complete training courses, modules, exams, verified certifications, expiring certifications, expired credentials, compliant/at-risk states, evidence artifacts, and skill gap benchmarks.

---

## 9. Instant Role Switching (Testing Guide)

In the top navigation bar of the application, click the **"Switch Role"** button to instantly switch between personas without logging out:
1. **Switch to Admin (Eleanor Vance):** Test course authoring, exam question building, compliance mandate configuration, and organization audit logs.
2. **Switch to Manager (Marcus Brody):** Test assigning courses to team members, reviewing direct report submissions, and verifying skill evidence (+15% proficiency boost).
3. **Switch to Employee (Rahul Sharma):** Test reading course modules, clicking "Mark Module Completed", taking timed multiple-choice assessments, and uploading certification proofs.
4. **Switch to Employee (Lucas Dupont):** Notice the **Non-Compliant** status caused by an expired First Aid certification and overdue safety training.

---

## 10. API Specification Summary

All API responses follow a standardized JSON envelope:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

### Key Endpoints:
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`
- `GET /api/departments`, `POST /api/departments`
- `GET /api/trainings`, `POST /api/trainings`
- `POST /api/assignments`, `GET /api/assignments/my`, `PATCH /api/progress/:assignmentId`
- `GET /api/assessments/:id`, `POST /api/assessments/:id/submit`
- `POST /api/employee-certifications`, `PATCH /api/employee-certifications/:id`
- `GET /api/compliance`, `POST /api/compliance/requirements`, `GET /api/compliance/:employeeId`
- `GET /api/skills`, `POST /api/evidence`, `PATCH /api/evidence/:id/verify`
- `GET /api/skill-gaps/:employeeId/role/:roleId`
- `GET /api/readiness/:employeeId/role/:roleId`
- `GET /api/recommendations/my`
- `GET /api/risk/my`, `GET /api/risk`
- `GET /api/analytics/admin`, `GET /api/analytics/manager`, `GET /api/analytics/employee`
- `GET /api/audit-logs`
- `GET /api/health`

---

## 11. Security Implementation

- **No Plaintext Passwords:** Hashed using `bcryptjs` with 10 salt rounds.
- **JWT Protection:** Signed using environment secret with standard claims and 24h expiry.
- **Resource Ownership Validation:** Employees can only inspect their own evidence, assessments, and certifications.
- **Sanitized Assessment Delivery:** Assessment answer keys (`correctAnswer`) are automatically stripped from payloads delivered to employees before submission.
- **Upload Restrictions:** Multer disk storage restricted to `application/pdf`, `image/jpeg`, and `image/png` with 10MB file size ceiling and sanitized unique timestamps.

---

## 12. License
Apache-2.0. Built for Google AI Studio.
