import React, { useState, useEffect } from 'react';
import { complianceApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

export const ManagerCompliance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complianceApi
      .getOverview()
      .then(res => {
        if (res.data?.success) setData(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const evaluations: any[] = data?.evaluations || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Team Regulatory Compliance Posture
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic compliance audit for all supervised staff based on mandatory courses and credentials
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Team Compliance Rate
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {summary.complianceRate || 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Compliant Members
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {summary.compliantCount || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            At-Risk Members
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {summary.atRiskCount || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Non-Compliant
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-700">
            {summary.nonCompliantCount || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Audit Assessment</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No team members to evaluate
                  </td>
                </tr>
              ) : (
                evaluations.map(ev => (
                  <tr key={ev.employeeId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{ev.employeeName}</td>
                    <td className="py-3 px-4 text-slate-500">{ev.jobTitle}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ev.overallStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 w-36">
                      <ProgressBar progress={ev.score} variant="compliance" />
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{ev.summary}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvaluation(ev)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Examine
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvaluation && (
        <Modal
          isOpen={!!selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
          title={`Compliance Audit: ${selectedEvaluation.employeeName}`}
          subtitle={`Overall Verdict: ${selectedEvaluation.overallStatus}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800">Summary: </span>
              <span className="text-slate-600">{selectedEvaluation.summary}</span>
            </div>

            <div className="space-y-2">
              {selectedEvaluation.requirements.map((r: any) => (
                <div
                  key={r.requirementId}
                  className="p-3 rounded-lg border border-slate-200 bg-white space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{r.title}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
