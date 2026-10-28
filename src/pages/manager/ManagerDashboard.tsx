import React, { useState, useEffect } from 'react';
import { analyticsApi, assignmentApi } from '../../services/api.ts';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Clock,
  Award,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    analyticsApi
      .getManagerAnalytics()
      .then(res => {
        if (res.data?.success) setData(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Team Supervision & Workforce Readiness Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor direct reports, assign training, verify evidence, and ensure departmental compliance
          </p>
        </div>

        <button
          onClick={() => navigate('/manager/team')}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          Assign Training to Team
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <DashboardCard
          title="Team Size"
          value={data?.teamSize || 0}
          subtitle="Direct reports"
          icon={Users}
          color="indigo"
          onClick={() => navigate('/manager/team')}
        />
        <DashboardCard
          title="Team Progress"
          value={`${data?.teamTrainingProgress || 0}%`}
          subtitle="Avg completion"
          icon={GraduationCap}
          color="emerald"
          onClick={() => navigate('/manager/training')}
        />
        <DashboardCard
          title="Overdue Courses"
          value={data?.overdueTrainingCount || 0}
          subtitle="Needs attention"
          icon={AlertTriangle}
          color="rose"
          onClick={() => navigate('/manager/training')}
        />
        <DashboardCard
          title="Upcoming Due"
          value={data?.upcomingDeadlinesCount || 0}
          subtitle="Due in <= 7 days"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/manager/training')}
        />
        <DashboardCard
          title="Expiring Certs"
          value={data?.expiringCertificationsCount || 0}
          subtitle="Expires soon"
          icon={Award}
          color="amber"
          onClick={() => navigate('/manager/certifications')}
        />
        <DashboardCard
          title="Compliance Rate"
          value={`${data?.teamComplianceRate || 0}%`}
          subtitle="Mandates met"
          icon={ShieldCheck}
          color={data?.teamComplianceRate >= 80 ? 'emerald' : 'amber'}
          onClick={() => navigate('/manager/compliance')}
        />
      </div>

      {/* Team Member Status Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Direct Reports Overview</h2>
            <p className="text-xs text-slate-500">
              Individual assignment completion and compliance standing
            </p>
          </div>
          <button
            onClick={() => navigate('/manager/team')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Manage Team Directory →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Assignments</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.teamMembers || []).map((m: any) => (
                <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    <p className="text-[11px] text-slate-400">{m.email}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{m.jobTitle}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-emerald-600 font-bold">{m.completedCount}</span> /{' '}
                    <span>{m.assignmentsCount}</span> completed
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.complianceStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/manager/readiness?employeeId=${m._id}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Check Readiness</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
