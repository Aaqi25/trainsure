import React, { useState, useEffect } from 'react';
import { analyticsApi, assignmentApi, intelligenceApi, certificationApi } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import {
  GraduationCap,
  Award,
  ShieldCheck,
  Flame,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      analyticsApi.getEmployeeAnalytics(),
      assignmentApi.getMyAssignments(),
      intelligenceApi.getMyRecommendations(),
    ])
      .then(([mRes, aRes, rRes]) => {
        if (mRes.data?.success) setMetrics(mRes.data.data);
        if (aRes.data?.success) setAssignments(aRes.data.data || []);
        if (rRes.data?.success) setRecommendations(rRes.data.data?.recommendations || []);
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

  const activeCourses = assignments.filter(a => a.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Employee Capability Workspace
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.jobTitle} · Employee ID: <span className="font-mono">{user?.employeeId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employee/training')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Continue Learning
          </button>
          <button
            onClick={() => navigate('/employee/evidence')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Submit Skill Evidence
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <DashboardCard
          title="Assigned Courses"
          value={metrics?.training?.total || 0}
          subtitle="Enrolled programs"
          icon={GraduationCap}
          color="indigo"
          onClick={() => navigate('/employee/training')}
        />
        <DashboardCard
          title="Completed Courses"
          value={metrics?.training?.completed || 0}
          subtitle="100% finished"
          icon={BookOpen}
          color="emerald"
        />
        <DashboardCard
          title="Active Credentials"
          value={metrics?.certificationsCount || 0}
          subtitle="Verified proof"
          icon={Award}
          color="sky"
          onClick={() => navigate('/employee/certifications')}
        />
        <DashboardCard
          title="Verified Skills"
          value={metrics?.verifiedSkillsCount || 0}
          subtitle={`of ${metrics?.skillsCount || 0} recorded`}
          icon={Flame}
          color="amber"
          onClick={() => navigate('/employee/skills')}
        />
        <DashboardCard
          title="Compliance Standing"
          value={metrics?.complianceStatus || 'COMPLIANT'}
          subtitle={`Score: ${metrics?.complianceScore || 100}%`}
          icon={ShieldCheck}
          color={metrics?.complianceStatus === 'COMPLIANT' ? 'emerald' : 'amber'}
        />
        <DashboardCard
          title="Compliance Risk"
          value={metrics?.riskLevel || 'LOW'}
          subtitle={`Score: ${metrics?.riskScore || 0}/100`}
          icon={AlertTriangle}
          color={metrics?.riskLevel === 'HIGH' ? 'rose' : metrics?.riskLevel === 'MEDIUM' ? 'amber' : 'emerald'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Learning Assignments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Current Learning Roadmap</h2>
              <p className="text-xs text-slate-500">Active assigned modules and completion pace</p>
            </div>
            <button
              onClick={() => navigate('/employee/training')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all courses →
            </button>
          </div>

          <div className="space-y-3">
            {activeCourses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All training modules completed! Check recommendations below to advance further.
              </div>
            ) : (
              activeCourses.map(a => (
                <div
                  key={a._id}
                  className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {a.training?.title}
                      </span>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                    <div className="mt-2 w-full max-w-xs">
                      <ProgressBar progress={a.progress || 0} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Due: {new Date(a.dueDate).toLocaleDateString()} · {a.training?.duration} Hours
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/employee/training')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Resume Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actionable Learning Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Recommended Next Steps</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Rule-based learning suggestions mapped directly to bridge your identified skill gaps
            </p>

            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 leading-snug">
                      {rec.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">
                      {rec.skillName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/employee/recommendations')}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Explore Full Recommendation Catalog →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
