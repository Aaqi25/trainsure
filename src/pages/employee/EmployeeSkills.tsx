import React, { useState, useEffect } from 'react';
import { skillApi, evidenceApi } from '../../services/api.ts';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Flame, Plus, ShieldCheck, FileText, ExternalLink, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeSkills: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Evidence Modal
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [evidenceType, setEvidenceType] = useState('PROJECT');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [score, setScore] = useState<number | ''>(85);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSkills = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        skillApi.getEmployeeSkills('my'),
        skillApi.getSkills(),
      ]);
      if (sRes.data?.success) setSkills(sRes.data.data || []);
      if (cRes.data?.success) setCatalog(cRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const openEvidenceModal = (skillId?: string) => {
    setSelectedSkillId(skillId || catalog[0]?._id || '');
    setEvidenceType('PROJECT');
    setEvidenceTitle('');
    setEvidenceDesc('');
    setScore(85);
    setFile(null);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId || !evidenceTitle) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('skillId', selectedSkillId);
      formData.append('type', evidenceType);
      formData.append('title', evidenceTitle);
      formData.append('description', evidenceDesc);
      if (score !== '') formData.append('score', String(score));
      if (file) formData.append('file', file);

      const res = await evidenceApi.submitEvidence(formData);
      if (res.data?.success) {
        setIsEvidenceModalOpen(false);
        fetchSkills();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Evidence-Based Skill Profile & Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your verified capabilities backed by training completions, assessments, project deliverables, and manager endorsements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/employee/skill-gaps')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Inspect Skill Gaps
          </button>
          <button
            onClick={() => openEvidenceModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Submit Evidence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skills.map(s => (
          <div
            key={s._id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {s.skill?.category || 'General'}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{s.skill?.name}</h3>
                </div>
                {s.verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 font-medium">Pending Review</span>
                )}
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Proficiency Level</span>
                  <span className="font-bold text-slate-900">{s.levelLabel}</span>
                </div>
                <ProgressBar progress={s.proficiency} size="md" />
              </div>

              {/* Attached Evidence List */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Supporting Evidence ({s.evidenceCount})
                </h4>
                {s.evidenceCount === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No artifacts attached yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {(s.evidence || []).map((ev: any) => (
                      <div
                        key={ev._id}
                        className="text-[11px] p-1.5 rounded bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700 truncate">{ev.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {ev.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => openEvidenceModal(s.skillId)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                + Add Evidence Artifact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Evidence Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Submit Verifiable Skill Evidence"
        subtitle="Attach project proof, course completion, or assessment results to validate your proficiency"
      >
        <form onSubmit={handleEvidenceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Skill</label>
            <select
              required
              value={selectedSkillId}
              onChange={e => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              {catalog.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evidence Category
              </label>
              <select
                value={evidenceType}
                onChange={e => setEvidenceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="PROJECT">Real-World Project Deliverable</option>
                <option value="TRAINING">Coursework Completion</option>
                <option value="ASSESSMENT">Graded Technical Exam</option>
                <option value="CERTIFICATION">Industry Certification Proof</option>
                <option value="EXTERNAL_LEARNING">External Accreditation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Demonstrated Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={e => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 85"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Artifact Title</label>
            <input
              type="text"
              required
              value={evidenceTitle}
              onChange={e => setEvidenceTitle(e.target.value)}
              placeholder="e.g. Architected High-Throughput REST Gateway in Express"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Deliverable Context
            </label>
            <textarea
              rows={2}
              value={evidenceDesc}
              onChange={e => setEvidenceDesc(e.target.value)}
              placeholder="Explain how this artifact demonstrates practical mastery..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Supporting Document or PDF (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Evidence for Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
