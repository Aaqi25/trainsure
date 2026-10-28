import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { MainLayout } from './layouts/MainLayout.tsx';
import { Login } from './pages/auth/Login.tsx';
import { Register } from './pages/auth/Register.tsx';

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx').then(m => ({ default: m.AdminDashboard })));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees.tsx').then(m => ({ default: m.AdminEmployees })));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments.tsx').then(m => ({ default: m.AdminDepartments })));
const AdminTrainings = lazy(() => import('./pages/admin/AdminTrainings.tsx').then(m => ({ default: m.AdminTrainings })));
const AdminAssessments = lazy(() => import('./pages/admin/AdminAssessments.tsx').then(m => ({ default: m.AdminAssessments })));
const AdminCertifications = lazy(() => import('./pages/admin/AdminCertifications.tsx').then(m => ({ default: m.AdminCertifications })));
const AdminCompliance = lazy(() => import('./pages/admin/AdminCompliance.tsx').then(m => ({ default: m.AdminCompliance })));
const AdminSkills = lazy(() => import('./pages/admin/AdminSkills.tsx').then(m => ({ default: m.AdminSkills })));
const AdminRolesProjects = lazy(() => import('./pages/admin/AdminRolesProjects.tsx').then(m => ({ default: m.AdminRolesProjects })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics.tsx').then(m => ({ default: m.AdminAnalytics })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs.tsx').then(m => ({ default: m.AdminAuditLogs })));

// Manager Pages (Lazy Loaded)
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard.tsx').then(m => ({ default: m.ManagerDashboard })));
const ManagerTeam = lazy(() => import('./pages/manager/ManagerTeam.tsx').then(m => ({ default: m.ManagerTeam })));
const ManagerTraining = lazy(() => import('./pages/manager/ManagerTraining.tsx').then(m => ({ default: m.ManagerTraining })));
const ManagerAssessments = lazy(() => import('./pages/manager/ManagerAssessments.tsx').then(m => ({ default: m.ManagerAssessments })));
const ManagerCertifications = lazy(() => import('./pages/manager/ManagerCertifications.tsx').then(m => ({ default: m.ManagerCertifications })));
const ManagerCompliance = lazy(() => import('./pages/manager/ManagerCompliance.tsx').then(m => ({ default: m.ManagerCompliance })));
const ManagerSkillsEvidence = lazy(() => import('./pages/manager/ManagerSkillsEvidence.tsx').then(m => ({ default: m.ManagerSkillsEvidence })));
const ManagerProjects = lazy(() => import('./pages/manager/ManagerProjects.tsx').then(m => ({ default: m.ManagerProjects })));
const ManagerReadiness = lazy(() => import('./pages/manager/ManagerReadiness.tsx').then(m => ({ default: m.ManagerReadiness })));

// Employee Pages (Lazy Loaded)
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.tsx').then(m => ({ default: m.EmployeeDashboard })));
const EmployeeTraining = lazy(() => import('./pages/employee/EmployeeTraining.tsx').then(m => ({ default: m.EmployeeTraining })));
const EmployeeAssessments = lazy(() => import('./pages/employee/EmployeeAssessments.tsx').then(m => ({ default: m.EmployeeAssessments })));
const EmployeeCertifications = lazy(() => import('./pages/employee/EmployeeCertifications.tsx').then(m => ({ default: m.EmployeeCertifications })));
const EmployeeSkills = lazy(() => import('./pages/employee/EmployeeSkills.tsx').then(m => ({ default: m.EmployeeSkills })));
const EmployeeEvidence = lazy(() => import('./pages/employee/EmployeeEvidence.tsx').then(m => ({ default: m.EmployeeEvidence })));
const EmployeeSkillGaps = lazy(() => import('./pages/employee/EmployeeSkillGaps.tsx').then(m => ({ default: m.EmployeeSkillGaps })));
const EmployeeRecommendations = lazy(() => import('./pages/employee/EmployeeRecommendations.tsx').then(m => ({ default: m.EmployeeRecommendations })));
const EmployeeReadiness = lazy(() => import('./pages/employee/EmployeeReadiness.tsx').then(m => ({ default: m.EmployeeReadiness })));
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile.tsx').then(m => ({ default: m.EmployeeProfile })));

// Shared Pages (Lazy Loaded)
const NotificationsPage = lazy(() => import('./pages/common/NotificationsPage.tsx').then(m => ({ default: m.NotificationsPage })));

// Protected Route Component with Role Checks
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>;
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/employee" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on user role
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDepartments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trainings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminTrainings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assessments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certifications"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCertifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/compliance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCompliance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/skills"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminSkills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles-projects"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminRolesProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/team"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/training"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerTraining />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/assessments"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/certifications"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerCertifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/compliance"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerCompliance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/skills"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerSkillsEvidence />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/projects"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/readiness"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <ManagerReadiness />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/training"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeTraining />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/assessments"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/certifications"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeCertifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/skills"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeSkills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/evidence"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeEvidence />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/skill-gaps"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeSkillGaps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/recommendations"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeRecommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/readiness"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeReadiness />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />

            {/* Common Notification Route */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Friendly URL aliases for notifications and links */}
            <Route path="/training" element={<Navigate to="/employee/training" replace />} />
            <Route path="/assessments" element={<Navigate to="/employee/assessments" replace />} />
            <Route path="/certifications" element={<Navigate to="/employee/certifications" replace />} />
            <Route path="/skills" element={<Navigate to="/employee/skills" replace />} />
            <Route path="/compliance" element={<Navigate to="/employee/profile" replace />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
