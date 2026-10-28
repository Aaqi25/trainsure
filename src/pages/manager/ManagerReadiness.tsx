import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userApi, roleProjectApi, intelligenceApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { Compass, CheckCircle2, AlertCircle, XCircle, FileText, Sparkles } from 'lucide-react';

export const ManagerReadiness: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmpId = searchParams.get('employeeId') || '';

  const [team, setTeam] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmpId);
  const [targetType, setTargetType] = useState<'ROLE' | 'PROJECT'>('ROLE');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [readinessData, setReadinessData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      userApi.getUsers(),
      roleProjectApi.getRoles(),
      roleProjectApi.getProjects(),
    ]).then(([uRes, rRes, pRes]) => {
      if (uRes.data?.success) {
        const list = uRes.data.data.filter((u: any) => u.role === 'EMPLOYEE');
        setTeam(list);
        if (!selectedEmpId && list.length > 0) setSelectedEmpId(list[0]._id);
      }
      if (rRes.data?.success) {
        const rList = rRes.data.data || [];
        setRoles(rList);
        if (targetType === 'ROLE' && rList.length > 0) setSelectedTargetId(rList[0]._id);
      }
      if (pRes.data?.success) {
        setProjects(pRes.data.data || []);
      }
    });
  }, []);

  useEffect(() => {
    if (targetType === 'ROLE' && roles.length > 0 && !selectedTargetId) {
      setSelectedTargetId(roles[0]._id);
    } else if (targetType === 'PROJECT' && projects.length > 0 && !selectedTargetId) {
      setSelectedTargetId(projects[0]._id);
    }
  }, [targetType, roles, projects]);

  const evaluateReadiness = async () => {
    if (!selectedEmpId || !selectedTargetId) return;
    setLoading(true);
    try {
      let res;
      if (targetType === 'ROLE') {
        res = await intelligenceApi.getRoleReadiness(selectedEmpId, selectedTargetId);
      } else {
        res = await intelligenceApi.getProjectReadiness(selectedEmpId, selectedTargetId);
      }
      if (res.data?.success) setReadinessData(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Readiness evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId && selectedTargetId) {
      evaluateReadiness();
    }
  }, [selectedEmpId, selectedTargetId, targetType]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Workforce Role & Project Readiness Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic gap analysis comparing employee verified skills against role benchmarks and project criteria
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Employee
          </label>
          <select
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600"
          >
            {team.map(m => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.jobTitle})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetType('ROLE');
                setSelectedTargetId(roles[0]?._id || '');
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                targetType === 'ROLE'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Job Role
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('PROJECT');
                setSelectedTargetId(projects[0]?._id || '');
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                targetType === 'PROJECT'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Strategic Project
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select {targetType === 'ROLE' ? 'Role' : 'Project'}
          </label>
          <select
            value={selectedTargetId}
            onChange={e => setSelectedTargetId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600"
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

      {/* Results View */}
      {readinessData && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Banner Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Readiness Evaluation for
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {readinessData.employeeName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-indigo-700 mt-0.5">
                {readinessData.targetName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {readinessData.recommendationSummary}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-64">
              <div className="text-center">
                <span className="text-3xl font-extrabold font-mono text-slate-900">
                  {readinessData.readinessPercentage}%
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                  Readiness Score
                </p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <StatusBadge status={readinessData.status} size="md" />
                <p className="text-[11px] text-slate-500 mt-1">
                  {readinessData.matchedSkillsCount} of {readinessData.totalRequiredSkills} skills matched
                </p>
              </div>
            </div>
          </div>

          {/* Skill Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Skill Competency Gap Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Transparent mathematical comparison of verified employee proficiency vs benchmark
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">0-100 Scale</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Benchmark Required</th>
                    <th className="py-3 px-4">Current Employee Proficiency</th>
                    <th className="py-3 px-4">Status & Gap</th>
                    <th className="py-3 px-4 text-right">Supporting Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readinessData.skills.map((s: any) => (
                    <tr key={s.skillId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.skillName}</td>
                      <td className="py-3 px-4 text-slate-500">{s.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {s.requiredProficiency}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {s.employeeProficiency}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} size="sm" />
                          {s.gap > 0 && (
                            <span className="text-[11px] font-mono text-rose-600 font-semibold">
                              (-{s.gap} pts)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.evidenceCount > 0 ? (
                          <div className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{s.evidenceCount} verified artifacts</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 artifacts on record</span>
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
