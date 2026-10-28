import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api.ts';
import { History, Search, Shield, User, FileText } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getAuditLogs()
      .then(res => {
        if (res.data?.success) setLogs(res.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.actorName || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.entity || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          System Security & Compliance Audit Log
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event ledger tracking administrative operations, mandate enforcements, and evidence verifications
        </p>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, action type, or entity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No audit records found matching your query
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {l.actorName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {l.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{l.action}</td>
                    <td className="py-3 px-4 text-slate-800">{l.entity}</td>
                    <td className="py-3 px-4 font-sans text-slate-500 text-[11px] truncate max-w-xs">
                      {l.details ? JSON.stringify(l.details) : '—'}
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
