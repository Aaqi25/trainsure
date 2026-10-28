import axios from 'axios';

// Production: VITE_API_URL should point to the Render backend (e.g. https://trainsure-api.onrender.com/api or https://trainsure-api.onrender.com)
// Development: Falls back to /api (relative to current origin, proxied by Vite dev server)
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

/**
 * Resolves uploaded media/document assets hosted on the backend Express service.
 * In a decoupled Vercel + Render deployment, relative URLs like /uploads/... must point to Render.
 */
export function getAssetUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const serverOrigin = rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return serverOrigin ? `${serverOrigin}${cleanPath}` : cleanPath;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('trainsure_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token if invalid session
      localStorage.removeItem('trainsure_token');
      localStorage.removeItem('trainsure_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// API Helper Methods
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getDemoUsers: () => api.get('/auth/demo-users'),
  switchDemo: (userId: string) => api.post('/auth/switch-demo', { userId }),
};

export const userApi = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.patch(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export const departmentApi = {
  getDepartments: () => api.get('/departments'),
  getDepartmentById: (id: string) => api.get(`/departments/${id}`),
  createDepartment: (data: any) => api.post('/departments', data),
  updateDepartment: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
};

export const trainingApi = {
  getTrainings: (params?: any) => api.get('/trainings', { params }),
  getTrainingById: (id: string) => api.get(`/trainings/${id}`),
  createTraining: (data: any) => api.post('/trainings', data),
  updateTraining: (id: string, data: any) => api.patch(`/trainings/${id}`, data),
  deleteTraining: (id: string) => api.delete(`/trainings/${id}`),
};

export const assignmentApi = {
  createAssignment: (data: any) => api.post('/assignments', data),
  getAssignments: (params?: any) => api.get('/assignments', { params }),
  getMyAssignments: () => api.get('/assignments/my'),
  getMyProgress: () => api.get('/progress/my'),
  updateProgress: (assignmentId: string, data: any) => api.patch(`/progress/${assignmentId}`, data),
};

export const assessmentApi = {
  getAssessments: () => api.get('/assessments'),
  getAssessmentById: (id: string) => api.get(`/assessments/${id}`),
  createAssessment: (data: any) => api.post('/assessments', data),
  submitAssessment: (id: string, data: any) => api.post(`/assessments/${id}/submit`, data),
  getAssessmentResults: (id: string) => api.get(`/assessments/${id}/results`),
};

export const certificationApi = {
  getCertifications: () => api.get('/certifications'),
  createCertification: (data: any) => api.post('/certifications', data),
  uploadEmployeeCertification: (formData: FormData) =>
    api.post('/employee-certifications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getEmployeeCertifications: (params?: any) => api.get('/employee-certifications', { params }),
  getMyEmployeeCertifications: () => api.get('/employee-certifications/my'),
  verifyEmployeeCertification: (id: string, verified: boolean) =>
    api.patch(`/employee-certifications/${id}`, { verified }),
};

export const complianceApi = {
  getRequirements: () => api.get('/compliance/requirements'),
  createRequirement: (data: any) => api.post('/compliance/requirements', data),
  getOverview: () => api.get('/compliance'),
  getAtRisk: () => api.get('/compliance/at-risk'),
  getNonCompliant: () => api.get('/compliance/non-compliant'),
  getEmployeeCompliance: (employeeId: string) => api.get(`/compliance/${employeeId}`),
};

export const skillApi = {
  getSkills: () => api.get('/skills'),
  createSkill: (data: any) => api.post('/skills', data),
  getEmployeeSkills: (id: string) => api.get(`/employees/${id}/skills`),
  addEmployeeSkill: (id: string, data: any) => api.post(`/employees/${id}/skills`, data),
  updateEmployeeSkill: (id: string, skillId: string, data: any) =>
    api.patch(`/employees/${id}/skills/${skillId}`, data),
};

export const evidenceApi = {
  submitEvidence: (formData: FormData) =>
    api.post('/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getEvidence: (params?: any) => api.get('/evidence', { params }),
  getMyEvidence: () => api.get('/evidence/my'),
  verifyEvidence: (id: string, verified: boolean, proficiencyBoost?: number) =>
    api.patch(`/evidence/${id}/verify`, { verified, proficiencyBoost }),
};

export const roleProjectApi = {
  getRoles: () => api.get('/roles'),
  createRole: (data: any) => api.post('/roles', data),
  getProjects: () => api.get('/projects'),
  createProject: (data: any) => api.post('/projects', data),
  getLearningResources: () => api.get('/learning-resources'),
  createLearningResource: (data: any) => api.post('/learning-resources', data),
};

export const intelligenceApi = {
  getRoleSkillGaps: (employeeId: string, roleId: string) =>
    api.get(`/skill-gaps/${employeeId}/role/${roleId}`),
  getProjectSkillGaps: (employeeId: string, projectId: string) =>
    api.get(`/skill-gaps/${employeeId}/project/${projectId}`),
  getRoleReadiness: (employeeId: string, roleId: string) =>
    api.get(`/readiness/${employeeId}/role/${roleId}`),
  getProjectReadiness: (employeeId: string, projectId: string) =>
    api.get(`/readiness/${employeeId}/project/${projectId}`),
  getMyRecommendations: () => api.get('/recommendations/my'),
  getEmployeeRecommendations: (employeeId: string) => api.get(`/recommendations/${employeeId}`),
  getMyRisk: () => api.get('/risk/my'),
  getEmployeeRisk: (employeeId: string) => api.get(`/risk/${employeeId}`),
  getAllRisks: () => api.get('/risk'),
};

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const analyticsApi = {
  getAdminAnalytics: () => api.get('/analytics/admin'),
  getManagerAnalytics: () => api.get('/analytics/manager'),
  getEmployeeAnalytics: () => api.get('/analytics/employee'),
  getAuditLogs: () => api.get('/audit-logs'),
  runJobsNow: () => api.post('/admin/run-jobs'),
  resetSeedData: () => api.post('/admin/reset-seed'),
};
