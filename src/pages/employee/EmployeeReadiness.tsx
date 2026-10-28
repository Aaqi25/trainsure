import React, { useState, useEffect } from 'react';
import { roleProjectApi, intelligenceApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { Compass, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeReadiness: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'ROLE' | 'PROJECT'>('ROLE');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([roleProjectApi.getRoles(), roleProjectApi.getProjects()]).then(([rRes, pRes]) => {
      if (rRes.data?.success) {
        const rList = rRes.data.data || [];
        setRoles(rList);
        if (rList.length > 0) setSelectedTargetId(rList[0]._id);
      }
      if (pRes.data?.success) setProjects(pRes.data.data || []);
    });
  }, []);

  const fetchReadiness = async () => {
    if (!selectedTargetId) return;
    setLoading(true);
    try {
      let res;
      if (targetType === 'ROLE') {
        res = await intelligenceApi.getRoleReadiness('my', selectedTargetId);
      } else {
        res = await intelligenceApi.getProjectReadiness('my', selectedTargetId);
      }
      if (res.data?.success) setReadiness(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [selectedTargetId, targetType]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Role & Project Workforce Readiness
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic evaluation comparing your verified capabilities and evidence against role standards and project staffing
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-48">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTargetType('ROLE');
                if (roles.length > 0) setSelectedTargetId(roles[0]._id);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                targetType === 'ROLE'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Role
            </button>
            <button
              onClick={() => {
                setTargetType('PROJECT');
                if (projects.length > 0) setSelectedTargetId(projects[0]._id);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                targetType === 'PROJECT'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Project
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select {targetType === 'ROLE' ? 'Target Role Standard' : 'Target Project'}
          </label>
          <select
            value={selectedTargetId}
            onChange={e => setSelectedTargetId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            {targetType === 'ROLE'
              ? roles.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))
              : projects.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {readiness && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Readiness Target
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{readiness.targetName}</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{readiness.targetDescription}</p>
              <div className="mt-3">
                <StatusBadge status={readiness.status} size="md" />
              </div>
            </div>

            <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200 min-w-64">
              <div className="text-center">
                <span className="text-4xl font-extrabold font-mono text-slate-900">
                  {readiness.readinessPercentage}%
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Overall Readiness
                </p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-xs space-y-1">
                <p className="text-emerald-700 font-semibold">
                  ✓ {readiness.matchedSkillsCount} Matched
                </p>
                <p className="text-amber-700 font-semibold">
                  ⚠ {readiness.gapSkillsCount} Partial Gaps
                </p>
                <p className="text-rose-700 font-semibold">
                  ✗ {readiness.missingSkillsCount} Missing
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Skills & Evidence Matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4">Benchmark Required</th>
                    <th className="py-3 px-4">Your Verified Proficiency</th>
                    <th className="py-3 px-4">Readiness Status</th>
                    <th className="py-3 px-4 text-right">Supporting Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readiness.skills.map((s: any) => (
                    <tr key={s.skillId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{s.skillName}</span>
                        <p className="text-[11px] text-slate-400">{s.category}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {s.requiredProficiency}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {s.employeeProficiency}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={s.status} size="sm" />
                          {s.gap > 0 && (
                            <span className="text-[11px] font-mono text-rose-600">
                              (-{s.gap} pts)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.evidenceCount > 0 ? (
                          <span className="text-slate-700 font-medium">
                            {s.evidenceCount} verified artifacts
                          </span>
                        ) : (
                          <button
                            onClick={() => navigate('/employee/skills')}
                            className="text-indigo-600 hover:text-indigo-800 underline text-[11px] cursor-pointer"
                          >
                            + Submit Evidence
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
