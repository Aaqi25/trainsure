import React, { useState, useEffect } from 'react';
import { roleProjectApi, intelligenceApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { Compass, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeSkillGaps: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'ROLE' | 'PROJECT'>('ROLE');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [gapData, setGapData] = useState<any | null>(null);
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

  const fetchGaps = async () => {
    if (!selectedTargetId) return;
    setLoading(true);
    try {
      let res;
      if (targetType === 'ROLE') {
        res = await intelligenceApi.getRoleSkillGaps('my', selectedTargetId);
      } else {
        res = await intelligenceApi.getProjectSkillGaps('my', selectedTargetId);
      }
      if (res.data?.success) setGapData(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [selectedTargetId, targetType]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Competency & Skill Gap Analysis
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Benchmark your verified capabilities against target organizational roles and strategic project requirements
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-48">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Dimension</label>
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
            Select {targetType === 'ROLE' ? 'Benchmark Job Role' : 'Project Assignment'}
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

      {gapData && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Evaluation Target
              </span>
              <h2 className="text-lg font-bold text-slate-900">{gapData.targetName}</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {gapData.recommendationSummary}
              </p>
            </div>

            <button
              onClick={() => navigate('/employee/recommendations')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Bridge Identified Gaps</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Matched Skills */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Matched Competencies ({(gapData.matchedSkills || []).length})
                </h3>
              </div>
              <div className="space-y-2">
                {(gapData.matchedSkills || []).length === 0 ? (
                  <p className="text-xs text-slate-400">None satisfying threshold yet</p>
                ) : (
                  gapData.matchedSkills.map((s: any) => (
                    <div key={s.skillId} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{s.skillName}</span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {s.employeeProficiency}% / {s.requiredProficiency}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Partial Gaps */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Partial Gaps ({(gapData.gapSkills || []).length})
                </h3>
              </div>
              <div className="space-y-2">
                {(gapData.gapSkills || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No partial gaps</p>
                ) : (
                  gapData.gapSkills.map((s: any) => (
                    <div key={s.skillId} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{s.skillName}</span>
                        <span className="font-mono text-xs font-bold text-amber-700">
                          {s.employeeProficiency}% / {s.requiredProficiency}%
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Requires +{s.gap} points advancement
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Missing Skills ({(gapData.missingSkills || []).length})
                </h3>
              </div>
              <div className="space-y-2">
                {(gapData.missingSkills || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No missing skills</p>
                ) : (
                  gapData.missingSkills.map((s: any) => (
                    <div key={s.skillId} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{s.skillName}</span>
                        <span className="font-mono text-xs font-bold text-rose-700">
                          0% / {s.requiredProficiency}%
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1">
                        Foundational learning required
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
