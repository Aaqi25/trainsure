import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { MainLayout } from './layouts/MainLayout.tsx';
import { Login } from './pages/auth/Login.tsx';
import { Register } from './pages/auth/Register.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminEmployees } from './pages/admin/AdminEmployees.tsx';
import { AdminDepartments } from './pages/admin/AdminDepartments.tsx';
import { AdminTrainings } from './pages/admin/AdminTrainings.tsx';
import { AdminAssessments } from './pages/admin/AdminAssessments.tsx';
import { AdminCertifications } from './pages/admin/AdminCertifications.tsx';
import { AdminCompliance } from './pages/admin/AdminCompliance.tsx';
import { AdminSkills } from './pages/admin/AdminSkills.tsx';
import { AdminRolesProjects } from './pages/admin/AdminRolesProjects.tsx';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.tsx';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.tsx';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard.tsx';
import { ManagerTeam } from './pages/manager/ManagerTeam.tsx';
import { ManagerTraining } from './pages/manager/ManagerTraining.tsx';
import { ManagerAssessments } from './pages/manager/ManagerAssessments.tsx';
import { ManagerCertifications } from './pages/manager/ManagerCertifications.tsx';
import { ManagerCompliance } from './pages/manager/ManagerCompliance.tsx';
import { ManagerSkillsEvidence } from './pages/manager/ManagerSkillsEvidence.tsx';
import { ManagerProjects } from './pages/manager/ManagerProjects.tsx';
import { ManagerReadiness } from './pages/manager/ManagerReadiness.tsx';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.tsx';
import { EmployeeTraining } from './pages/employee/EmployeeTraining.tsx';
import { EmployeeAssessments } from './pages/employee/EmployeeAssessments.tsx';
import { EmployeeCertifications } from './pages/employee/EmployeeCertifications.tsx';
import { EmployeeSkills } from './pages/employee/EmployeeSkills.tsx';
import { EmployeeEvidence } from './pages/employee/EmployeeEvidence.tsx';
import { EmployeeSkillGaps } from './pages/employee/EmployeeSkillGaps.tsx';
import { EmployeeRecommendations } from './pages/employee/EmployeeRecommendations.tsx';
import { EmployeeReadiness } from './pages/employee/EmployeeReadiness.tsx';
import { EmployeeProfile } from './pages/employee/EmployeeProfile.tsx';

// Shared Pages
import { NotificationsPage } from './pages/common/NotificationsPage.tsx';

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
      </BrowserRouter>
    </AuthProvider>
  );
}
