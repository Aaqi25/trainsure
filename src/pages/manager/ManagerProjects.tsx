import React, { useState, useEffect } from 'react';
import { roleProjectApi, userApi } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { Briefcase, FolderGit2, Plus, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        roleProjectApi.getProjects(),
        userApi.getUsers({ role: 'EMPLOYEE' }),
      ]);
      if (pRes.data?.success) setProjects(pRes.data.data || []);
      if (uRes.data?.success) setTeam(uRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Strategic Projects & Staffing Requirements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate project staffing capabilities and identify skill gaps across project assignments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map(p => (
          <div
            key={p._id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  {p.status}
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900">{p.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{p.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Competencies Required for this Project
                </h4>
                <div className="space-y-1.5">
                  {(p.requiredSkillsDetails || []).map((sk: any) => (
                    <div
                      key={sk.skillId}
                      className="flex items-center justify-between text-xs p-2 rounded bg-slate-50"
                    >
                      <span className="font-semibold text-slate-800">{sk.name}</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {sk.requiredProficiency}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assigned Team Staff ({(p.team || []).length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(p.team || []).map((t: any) => (
                    <span
                      key={t._id}
                      className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-md"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => navigate(`/manager/readiness`)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                Run Project Gap Audit →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
