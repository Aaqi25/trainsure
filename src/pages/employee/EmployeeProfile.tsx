import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { analyticsApi, userApi } from '../../services/api.ts';
import { User, Mail, Phone, Building2, Briefcase, Award, GraduationCap, ShieldCheck } from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      Promise.all([userApi.getUserById(user._id), analyticsApi.getEmployeeAnalytics()])
        .then(([uRes, mRes]) => {
          if (uRes.data?.success) setProfile(uRes.data.data);
          if (mRes.data?.success) setMetrics(mRes.data.data);
        })
        .finally(() => setLoading(false));
    }
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile?.name || user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Employee Capability Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personal identification, departmental hierarchy, and learning accomplishments
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold font-mono shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <p className="text-xs text-indigo-300 font-medium">{profile?.jobTitle}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-indigo-400 font-semibold">{profile?.employeeId}</span>
                <span>·</span>
                <span>{profile?.role}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              Account Active
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Organizational Details
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 w-24">Department:</span>
                <span className="font-semibold text-slate-900">
                  {profile?.department?.name || 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 w-24">Manager:</span>
                <span className="font-semibold text-slate-900">
                  {profile?.manager?.name || 'Executive Staff'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 w-24">Email:</span>
                <span className="font-mono text-slate-900">{profile?.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 w-24">Phone:</span>
                <span className="font-mono text-slate-900">{profile?.phone || '+1 (555) 019-2831'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Capability Highlights
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-400">Completed Trainings</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {metrics?.training?.completed || 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-400">Active Certifications</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {metrics?.certificationsCount || 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-400">Verified Skills</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {metrics?.verifiedSkillsCount || 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-400">Compliance Score</p>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {metrics?.complianceScore || 100}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
