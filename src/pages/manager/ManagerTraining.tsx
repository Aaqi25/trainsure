import React, { useState, useEffect } from 'react';
import { assignmentApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { GraduationCap, Search, Clock, Calendar, AlertTriangle } from 'lucide-react';

export const ManagerTraining: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentApi
      .getAssignments({ status: statusFilter || undefined })
      .then(res => {
        if (res.data?.success) setAssignments(res.data.data || []);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = assignments.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.employee?.name || '').toLowerCase().includes(q) ||
      (a.training?.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Team Training Cadence & Learning Progress
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking of employee course modules, completion rates, and deadline adherence
        </p>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by team member or course title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Training Program</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No training assignments found
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{a.employee?.name}</span>
                      <p className="text-[11px] text-slate-400 font-mono">{a.employee?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{a.training?.title}</span>
                      <p className="text-[11px] text-slate-500">
                        {a.training?.category} · {a.training?.difficulty}
                      </p>
                    </td>
                    <td className="py-3 px-4 w-40">
                      <ProgressBar progress={a.progress || 0} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-800">
                        {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          a.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.priority}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
