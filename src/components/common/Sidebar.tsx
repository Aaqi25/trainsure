import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  ClipboardCheck,
  Award,
  ShieldAlert,
  Flame,
  Briefcase,
  FileCheck,
  Compass,
  Lightbulb,
  CheckCircle2,
  User,
  History,
  TrendingUp,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const adminLinks = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Employees', to: '/admin/employees', icon: Users },
    { label: 'Departments', to: '/admin/departments', icon: Building2 },
    { label: 'Training Catalog', to: '/admin/trainings', icon: GraduationCap },
    { label: 'Assessments', to: '/admin/assessments', icon: ClipboardCheck },
    { label: 'Certifications', to: '/admin/certifications', icon: Award },
    { label: 'Compliance Engine', to: '/admin/compliance', icon: ShieldAlert },
    { label: 'Skills Catalog', to: '/admin/skills', icon: Flame },
    { label: 'Roles & Projects', to: '/admin/roles-projects', icon: Briefcase },
    { label: 'Analytics & Reports', to: '/admin/analytics', icon: TrendingUp },
    { label: 'Audit Trail', to: '/admin/audit-logs', icon: History },
  ];

  const managerLinks = [
    { label: 'Team Dashboard', to: '/manager', icon: LayoutDashboard },
    { label: 'My Team', to: '/manager/team', icon: Users },
    { label: 'Training Monitor', to: '/manager/training', icon: GraduationCap },
    { label: 'Assessment Results', to: '/manager/assessments', icon: ClipboardCheck },
    { label: 'Certifications', to: '/manager/certifications', icon: Award },
    { label: 'Team Compliance', to: '/manager/compliance', icon: ShieldAlert },
    { label: 'Verify Evidence', to: '/manager/skills', icon: FileCheck },
    { label: 'Projects & Staffing', to: '/manager/projects', icon: Briefcase },
    { label: 'Readiness Explorer', to: '/manager/readiness', icon: Compass },
  ];

  const employeeLinks = [
    { label: 'My Dashboard', to: '/employee', icon: LayoutDashboard },
    { label: 'My Training', to: '/employee/training', icon: GraduationCap },
    { label: 'Assessments', to: '/employee/assessments', icon: ClipboardCheck },
    { label: 'My Certifications', to: '/employee/certifications', icon: Award },
    { label: 'My Skills Matrix', to: '/employee/skills', icon: Flame },
    { label: 'Submit Evidence', to: '/employee/evidence', icon: FileCheck },
    { label: 'Skill Gap Analysis', to: '/employee/skill-gaps', icon: Compass },
    { label: 'Recommended Learning', to: '/employee/recommendations', icon: Lightbulb },
    { label: 'Role & Project Readiness', to: '/employee/readiness', icon: CheckCircle2 },
    { label: 'My Profile', to: '/employee/profile', icon: User },
  ];

  let links = employeeLinks;
  let sectionTitle = 'Employee Workspace';

  if (user?.role === 'ADMIN') {
    links = adminLinks;
    sectionTitle = 'Organization Management';
  } else if (user?.role === 'MANAGER') {
    links = managerLinks;
    sectionTitle = 'Team Supervision';
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="px-5 py-4 border-b border-slate-800/80">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {sectionTitle}
        </p>
        <p className="text-xs text-slate-300 mt-0.5 truncate font-medium">
          {user?.name} · <span className="text-indigo-400">{user?.role}</span>
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/manager' || link.to === '/employee'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TrainSure Engine Active</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
      </div>
    </aside>
  );
};
