import React, { useState, useEffect } from 'react';
import { evidenceApi, getAssetUrl } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { FileCheck, FileText, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

export const EmployeeEvidence: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evidenceApi
      .getMyEvidence()
      .then(res => {
        if (res.data?.success) setEvidenceList(res.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          My Submitted Evidence Portfolio
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Artifacts demonstrating skill competence, pending manager review, and verified endorsements
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Artifact Title & Context</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Attached File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No evidence submitted yet. Visit "My Skills" to submit proof artifacts.
                  </td>
                </tr>
              ) : (
                evidenceList.map(e => (
                  <tr key={e._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{e.skill?.name}</span>
                      <p className="text-[11px] text-slate-400">{e.skill?.category}</p>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-semibold text-slate-800">{e.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{e.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {e.score !== undefined ? `${e.score}%` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {e.verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Endorsed
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {e.fileUrl ? (
                        <a
                          href={getAssetUrl(e.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No file</span>
                      )}
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
