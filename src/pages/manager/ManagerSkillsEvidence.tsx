import React, { useState, useEffect } from 'react';
import { evidenceApi, getAssetUrl } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { FileCheck, CheckCircle, ExternalLink, ShieldCheck, Flame } from 'lucide-react';

export const ManagerSkillsEvidence: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvidence = async () => {
    try {
      const res = await evidenceApi.getEvidence();
      if (res.data?.success) setEvidenceList(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await evidenceApi.verifyEvidence(id, verified, 15);
      fetchEvidence();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Verify Employee Skill Evidence
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review evidence artifacts submitted by team members and endorse verified proficiency advancements
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Skill Competency</th>
                <th className="py-3 px-4">Evidence Artifact</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Score / Document</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No submitted evidence records on file
                  </td>
                </tr>
              ) : (
                evidenceList.map(ev => (
                  <tr key={ev._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{ev.employee?.name}</span>
                      <p className="text-[11px] text-slate-400">{ev.employee?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-700">{ev.skill?.name}</span>
                      <p className="text-[11px] text-slate-400">{ev.skill?.category}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{ev.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ev.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        {ev.score !== undefined && (
                          <span className="font-mono font-bold text-slate-900">
                            Score: {ev.score}%
                          </span>
                        )}
                        {ev.fileUrl && (
                          <a
                            href={getAssetUrl(ev.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium mt-0.5"
                          >
                            <span>View Artifact</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ev.verified ? (
                        <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Endorsed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerify(ev._id, true)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Endorse (+15% Prof)</span>
                        </button>
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
