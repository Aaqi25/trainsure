import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api.ts';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jobTriggering, setJobTriggering] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsApi.getAdminAnalytics();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRunJobs = async () => {
    setJobTriggering(true);
    setFeedback(null);
    try {
      await analyticsApi.runJobsNow();
      setFeedback('Background jobs (expiry check, deadlines, compliance) executed successfully.');
      await fetchAnalytics();
    } catch {
      setFeedback('Failed to run jobs.');
    } finally {
      setJobTriggering(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database to default seed dataset?')) return;
    setLoading(true);
    try {
      await analyticsApi.resetSeedData();
      setFeedback('Database successfully reset to seed dataset.');
      await fetchAnalytics();
    } catch {
      setFeedback('Failed to reset seed data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = data?.cards || {};

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Organization Capability & Compliance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise overview of training completion, skill profiles, and regulatory compliance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunJobs}
            disabled={jobTriggering}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300/70 cursor-pointer"
            title="Execute daily cron rules immediately"
          >
            <Play className="w-3.5 h-3.5 text-indigo-600" />
            {jobTriggering ? 'Running...' : 'Run Cron Sweep'}
          </button>

          <button
            onClick={handleResetSeed}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300/70 cursor-pointer"
            title="Reset database to realistic seed dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            Reset Seed Data
          </button>

          <button
            onClick={() => navigate('/admin/trainings')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Training
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-indigo-400 hover:text-indigo-600">
            ×
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <DashboardCard
          title="Total Workforce"
          value={cards.totalEmployees}
          subtitle="Active team members"
          icon={Users}
          color="indigo"
          onClick={() => navigate('/admin/employees')}
        />
        <DashboardCard
          title="Active Trainings"
          value={cards.activeTrainings}
          subtitle="Courses in catalog"
          icon={GraduationCap}
          color="sky"
          onClick={() => navigate('/admin/trainings')}
        />
        <DashboardCard
          title="Completions"
          value={cards.completedTrainings}
          subtitle="Assignments finished"
          icon={CheckCircle2}
          color="emerald"
        />
        <DashboardCard
          title="Overdue Training"
          value={cards.overdueTrainings}
          subtitle="Needs intervention"
          icon={AlertTriangle}
          color="rose"
        />
        <DashboardCard
          title="Compliance Rate"
          value={`${cards.complianceRate}%`}
          subtitle="Mandatory rule coverage"
          icon={ShieldCheck}
          color={cards.complianceRate >= 80 ? 'emerald' : 'amber'}
          onClick={() => navigate('/admin/compliance')}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <DashboardCard
          title="Active Certifications"
          value={cards.activeCertifications}
          subtitle="Verified & active"
          icon={Award}
          color="emerald"
          onClick={() => navigate('/admin/certifications')}
        />
        <DashboardCard
          title="Expiring Soon"
          value={cards.expiringCertifications}
          subtitle="Expires in <= 30 days"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/admin/certifications')}
        />
        <DashboardCard
          title="Expired Certifications"
          value={cards.expiredCertifications}
          subtitle="Action required"
          icon={AlertTriangle}
          color="rose"
          onClick={() => navigate('/admin/certifications')}
        />
        <DashboardCard
          title="At-Risk Employees"
          value={cards.atRiskEmployees}
          subtitle="Upcoming expiry/deadlines"
          icon={ShieldAlert}
          color="amber"
          onClick={() => navigate('/admin/compliance')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Training Completion */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Department Training Completion Rate
              </h2>
              <p className="text-xs text-slate-500">Percentage of assignments completed by department</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Live DB</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.departmentStats || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="completionRate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Distribution Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Workforce Compliance Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Compliant vs At-Risk vs Non-Compliant staff
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Policy Rules</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.complianceDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(data?.complianceDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
