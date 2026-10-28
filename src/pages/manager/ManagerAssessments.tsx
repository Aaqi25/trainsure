import React, { useState, useEffect } from 'react';
import { assessmentApi, userApi } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';

export const ManagerAssessments: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentApi
      .getAssessments()
      .then(res => {
        if (res.data?.success) {
          const list = res.data.data || [];
          setAssessments(list);
          if (list.length > 0) setSelectedAssessmentId(list[0]._id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAssessmentId) {
      assessmentApi.getAssessmentResults(selectedAssessmentId).then(res => {
        if (res.data?.success) setAttempts(res.data.data || []);
      });
    }
  }, [selectedAssessmentId]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Team Assessment Performance & Exam Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review employee test submissions, scoring thresholds, and competency pass rates
        </p>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700">Filter Exam:</label>
        <select
          value={selectedAssessmentId}
          onChange={e => setSelectedAssessmentId(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          {assessments.map(a => (
            <option key={a._id} value={a._id}>
              {a.title} (Pass threshold: {a.passingScore}%)
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Attempt Timestamp</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Marks Earned</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Evidence Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No attempts submitted for this exam yet
                  </td>
                </tr>
              ) : (
                attempts.map(att => (
                  <tr key={att._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(att.attemptedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-base text-slate-900">
                      {att.score}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {att.earnedMarks} / {att.totalMarks}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={att.passed ? 'PASSED' : 'FAILED'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {att.passed ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          ✓ Added to Skills Profile
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Retake pending</span>
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
