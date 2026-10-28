import React, { useState, useEffect } from 'react';
import { complianceApi, trainingApi, certificationApi, departmentApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { ShieldCheck, ShieldAlert, AlertTriangle, Plus, Eye, ChevronRight } from 'lucide-react';

export const AdminCompliance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT'>('ALL');

  // Detail Modal
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);

  // Create Requirement Modal
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState<'TRAINING' | 'CERTIFICATION'>('TRAINING');
  const [targetTrainingId, setTargetTrainingId] = useState('');
  const [targetCertId, setTargetCertId] = useState('');
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const fetchData = async () => {
    try {
      const [compRes, reqRes, tRes, cRes, dRes] = await Promise.all([
        complianceApi.getOverview(),
        complianceApi.getRequirements(),
        trainingApi.getTrainings(),
        certificationApi.getCertifications(),
        departmentApi.getDepartments(),
      ]);
      if (compRes.data?.success) setData(compRes.data.data);
      if (reqRes.data?.success) setRequirements(reqRes.data.data || []);
      if (tRes.data?.success) setTrainings(tRes.data.data || []);
      if (cRes.data?.success) setCerts(cRes.data.data || []);
      if (dRes.data?.success) setDepartments(dRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await complianceApi.createRequirement({
        title: reqTitle,
        type: reqType,
        targetTrainingId: reqType === 'TRAINING' ? targetTrainingId : undefined,
        targetCertificationId: reqType === 'CERTIFICATION' ? targetCertId : undefined,
        appliesToAll,
        targetDepartmentId: !appliesToAll ? targetDeptId : undefined,
        targetRole: !appliesToAll ? targetRole : undefined,
      });
      setIsReqModalOpen(false);
      setReqTitle('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create requirement');
    }
  };

  const evaluations: any[] = data?.evaluations || [];
  const filteredEvaluations = evaluations.filter(e => {
    if (statusFilter === 'ALL') return true;
    return e.overallStatus === statusFilter;
  });

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Compliance Engine & Regulatory Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rule-based compliance evaluation, expiry risk detection, and audit posture
          </p>
        </div>
        <button
          onClick={() => setIsReqModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Compliance Mandate
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workforce Compliance Rate
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {summary.complianceRate || 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.compliantCount || 0} of {summary.totalEmployees || 0} fully compliant
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('COMPLIANT')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Compliant Staff
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {summary.compliantCount || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">All mandates verified</p>
        </div>

        <div
          onClick={() => setStatusFilter('AT_RISK')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            At-Risk Staff
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {summary.atRiskCount || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Expiring in &lt;= 30 days</p>
        </div>

        <div
          onClick={() => setStatusFilter('NON_COMPLIANT')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-colors cursor-pointer"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Non-Compliant
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-700">
            {summary.nonCompliantCount || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Breached deadlines or expired</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Filter View:</span>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['ALL', 'COMPLIANT', 'AT_RISK', 'NON_COMPLIANT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL'
                ? 'All Personnel'
                : tab === 'AT_RISK'
                ? 'At Risk'
                : tab === 'NON_COMPLIANT'
                ? 'Non-Compliant'
                : 'Compliant'}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Coverage Score</th>
                <th className="py-3 px-4">Findings Summary</th>
                <th className="py-3 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No employees matching this compliance status
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map(ev => (
                  <tr key={ev.employeeId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{ev.employeeName}</td>
                    <td className="py-3 px-4 text-slate-500">{ev.jobTitle}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ev.overallStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 w-40">
                      <ProgressBar progress={ev.score} variant="compliance" />
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {ev.summary}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvaluation(ev)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
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

      {/* Detailed Inspection Modal */}
      {selectedEvaluation && (
        <Modal
          isOpen={!!selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
          title={`Compliance Audit: ${selectedEvaluation.employeeName}`}
          subtitle={`Current Status: ${selectedEvaluation.overallStatus} · Score: ${selectedEvaluation.score}%`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800">Policy Verdict: </span>
              <span className="text-slate-600">{selectedEvaluation.summary}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Itemized Mandate Breakdown
              </h4>

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

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Mandate Modal */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title="Configure Regulatory Compliance Mandate"
      >
        <form onSubmit={handleCreateRequirement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandate Title
            </label>
            <input
              type="text"
              required
              value={reqTitle}
              onChange={e => setReqTitle(e.target.value)}
              placeholder="e.g. Annual Information Security Recertification"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requirement Type
            </label>
            <select
              value={reqType}
              onChange={e => setReqType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="TRAINING">Mandatory Training Course</option>
              <option value="CERTIFICATION">Mandatory Certification Credential</option>
            </select>
          </div>

          {reqType === 'TRAINING' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Training Course
              </label>
              <select
                required
                value={targetTrainingId}
                onChange={e => setTargetTrainingId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Select Course...</option>
                {trainings.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Certification
              </label>
              <select
                required
                value={targetCertId}
                onChange={e => setTargetCertId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Select Certification...</option>
                {certs.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.issuer})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="appliesAll"
              checked={appliesToAll}
              onChange={e => setAppliesToAll(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="appliesAll" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Enforce Organization-Wide (Applies to all active personnel)
            </label>
          </div>

          {!appliesToAll && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Department
                </label>
                <select
                  value={targetDeptId}
                  onChange={e => setTargetDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">None / Any</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Role Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Safety Coordinator"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReqModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Enact Mandate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
