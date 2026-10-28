import React, { useState, useEffect } from 'react';
import { roleProjectApi, skillApi, userApi } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { Briefcase, FolderGit2, Plus, Users, CheckCircle2, ChevronRight } from 'lucide-react';

export const AdminRolesProjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ROLES' | 'PROJECTS'>('ROLES');
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleSkills, setRoleSkills] = useState<Array<{ skillId: string; requiredProficiency: number }>>([]);

  // Project Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSkills, setProjSkills] = useState<Array<{ skillId: string; requiredProficiency: number }>>([]);

  const fetchData = async () => {
    try {
      const [rRes, pRes, sRes, mRes, eRes] = await Promise.all([
        roleProjectApi.getRoles(),
        roleProjectApi.getProjects(),
        skillApi.getSkills(),
        userApi.getUsers({ role: 'MANAGER' }),
        userApi.getUsers({ role: 'EMPLOYEE' }),
      ]);
      if (rRes.data?.success) setRoles(rRes.data.data || []);
      if (pRes.data?.success) setProjects(pRes.data.data || []);
      if (sRes.data?.success) setSkills(sRes.data.data || []);
      if (mRes.data?.success) setManagers(mRes.data.data || []);
      if (eRes.data?.success) setEmployees(eRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateRole = () => {
    setRoleName('');
    setRoleDesc('');
    setRoleSkills(skills.slice(0, 3).map(s => ({ skillId: s._id, requiredProficiency: 70 })));
    setIsRoleModalOpen(true);
  };

  const openCreateProject = () => {
    setProjName('');
    setProjDesc('');
    setProjSkills(skills.slice(0, 3).map(s => ({ skillId: s._id, requiredProficiency: 65 })));
    setIsProjectModalOpen(true);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleProjectApi.createRole({
        name: roleName,
        description: roleDesc,
        requiredSkills: roleSkills,
      });
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleProjectApi.createProject({
        name: projName,
        description: projDesc,
        requiredSkills: projSkills,
      });
      setIsProjectModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Role Benchmarks & Project Requirements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define target competencies and benchmark thresholds for job functions and active projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ROLES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'ROLES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Job Roles ({roles.length})
            </button>
            <button
              onClick={() => setActiveTab('PROJECTS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'PROJECTS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Strategic Projects ({projects.length})
            </button>
          </div>

          <button
            onClick={activeTab === 'ROLES' ? openCreateRole : openCreateProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === 'ROLES' ? 'New Role Benchmark' : 'New Project'}
          </button>
        </div>
      </div>

      {activeTab === 'ROLES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {roles.map(r => (
            <div
              key={r._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {r.requiredSkillsDetails?.length || 0} Core Skills
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">{r.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{r.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Required Proficiency Standards
                  </h4>
                  <div className="space-y-2">
                    {(r.requiredSkillsDetails || []).map((sk: any) => (
                      <div
                        key={sk.skillId}
                        className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100"
                      >
                        <span className="font-semibold text-slate-800">{sk.name}</span>
                        <span className="font-mono text-indigo-600 font-bold">
                          {sk.requiredProficiency}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(p => (
            <div
              key={p._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {p.status}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Required Competencies
                  </h4>
                  <div className="space-y-2">
                    {(p.requiredSkillsDetails || []).map((sk: any) => (
                      <div
                        key={sk.skillId}
                        className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100"
                      >
                        <span className="font-semibold text-slate-800">{sk.name}</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          {sk.requiredProficiency}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Lead: <strong className="text-slate-800">{p.manager?.name || 'Assigned Manager'}</strong>
                </span>
                <span>
                  Team: <strong className="text-slate-800 font-mono">{(p.team || []).length}</strong> assigned
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Define Role Competency Benchmark"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
            <input
              type="text"
              required
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="e.g. Lead Cloud Architect"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={roleDesc}
              onChange={e => setRoleDesc(e.target.value)}
              placeholder="Role responsibilities..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Select Required Skills & Minimum Proficiency (0-100%)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {skills.map(s => {
                const match = roleSkills.find(rs => rs.skillId === s._id);
                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                  >
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!match}
                        onChange={e => {
                          if (e.target.checked) {
                            setRoleSkills(prev => [...prev, { skillId: s._id, requiredProficiency: 70 }]);
                          } else {
                            setRoleSkills(prev => prev.filter(rs => rs.skillId !== s._id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{s.name}</span>
                    </label>

                    {match && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={match.requiredProficiency}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRoleSkills(prev =>
                              prev.map(rs => (rs.skillId === s._id ? { ...rs, requiredProficiency: val } : rs))
                            );
                          }}
                          className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400 font-mono">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Save Role Benchmark
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Define Project Staffing Requirements"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={projName}
              onChange={e => setProjName(e.target.value)}
              placeholder="e.g. NextGen Microservices Migration"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={projDesc}
              onChange={e => setProjDesc(e.target.value)}
              placeholder="Project goals and technical scope..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Select Required Skills & Minimum Proficiency (0-100%)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {skills.map(s => {
                const match = projSkills.find(ps => ps.skillId === s._id);
                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                  >
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!match}
                        onChange={e => {
                          if (e.target.checked) {
                            setProjSkills(prev => [...prev, { skillId: s._id, requiredProficiency: 65 }]);
                          } else {
                            setProjSkills(prev => prev.filter(ps => ps.skillId !== s._id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{s.name}</span>
                    </label>

                    {match && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={match.requiredProficiency}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProjSkills(prev =>
                              prev.map(ps => (ps.skillId === s._id ? { ...ps, requiredProficiency: val } : ps))
                            );
                          }}
                          className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400 font-mono">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
