import React, { useState, useEffect } from 'react';
import { analyticsApi, intelligenceApi } from '../../services/api.ts';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Users,
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
  AreaChart,
  Area,
} from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getAdminAnalytics(), intelligenceApi.getAllRisks()])
      .then(([aRes, rRes]) => {
        if (aRes.data?.success) setData(aRes.data.data);
        if (rRes.data?.success) setRiskData(rRes.data.data);
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

  const cards = data?.cards || {};
  const riskSummary = riskData?.summary || {};

  const riskPieData = [
    { name: 'Low Risk', value: riskSummary.lowRiskCount || 0, fill: '#10b981' },
    { name: 'Medium Risk', value: riskSummary.mediumRiskCount || 0, fill: '#f59e0b' },
    { name: 'High Risk', value: riskSummary.highRiskCount || 0, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Workforce Intelligence & Predictive Risk Reports
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep telemetry across employee skill acquisition, training cadence, and regulatory exposure
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashboardCard
          title="Overall Compliance"
          value={`${cards.complianceRate}%`}
          subtitle="Mandates fully satisfied"
          icon={ShieldCheck}
          color="emerald"
        />
        <DashboardCard
          title="High Risk Headcount"
          value={riskSummary.highRiskCount || 0}
          subtitle="Critical policy breach"
          icon={AlertTriangle}
          color="rose"
        />
        <DashboardCard
          title="Total Assignments"
          value={cards.completedTrainings + cards.overdueTrainings}
          subtitle="Training pipeline"
          icon={GraduationCap}
          color="indigo"
        />
        <DashboardCard
          title="Active Credentials"
          value={cards.activeCertifications}
          subtitle="Verified on record"
          icon={Award}
          color="sky"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Learning Velocity & Assignment Trend
              </h2>
              <p className="text-xs text-slate-500">Monthly assignments vs completions</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Monthly</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activityTrend || []}>
                <defs>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="assigned"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorAssigned)"
                  name="Assigned"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Compliance Risk Exposure Classification
              </h2>
              <p className="text-xs text-slate-500">
                Rule-based risk score distribution across all employees
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Risk Engine</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {riskPieData.map((entry, index) => (
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

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            Department Performance & Capability Coverage
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Workforce Headcount</th>
                <th className="py-3 px-4">Assigned Modules</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.departmentStats || []).map((d: any) => (
                <tr key={d.departmentId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {d.employeeCount}
                  </td>
                  <td className="py-3 px-4 font-mono">{d.totalAssignments}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                    {d.completedAssignments}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {d.completionRate}%
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
