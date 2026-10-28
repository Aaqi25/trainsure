import React, { useState, useEffect } from 'react';
import { certificationApi, getAssetUrl } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Award, Plus, FileText, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

export const EmployeeCertifications: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certificationId, setCertificationId] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCerts = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        certificationApi.getMyEmployeeCertifications(),
        certificationApi.getCertifications(),
      ]);
      if (mRes.data?.success) setCerts(mRes.data.data || []);
      if (cRes.data?.success) setCatalog(cRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificationId || !certificateNumber || !issueDate || !expiryDate) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificationId', certificationId);
      formData.append('certificateNumber', certificateNumber);
      formData.append('issueDate', new Date(issueDate).toISOString());
      formData.append('expiryDate', new Date(expiryDate).toISOString());
      if (file) {
        formData.append('file', file);
      }

      const res = await certificationApi.uploadEmployeeCertification(formData);
      if (res.data?.success) {
        setIsModalOpen(false);
        setCertificateNumber('');
        setFile(null);
        fetchCerts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Certificate upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Professional Certifications & Credentials
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store proof artifacts, monitor renewal deadlines, and maintain verified regulatory credentials
          </p>
        </div>
        <button
          onClick={() => {
            setCertificationId(catalog[0]?._id || '');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Upload Certificate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {certs.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No certifications uploaded yet. Click "Upload Certificate" to register your credentials.
          </div>
        ) : (
          certs.map(c => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {c.certification?.name}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold">{c.certification?.issuer}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Credential ID:</span>
                    <strong className="font-mono text-slate-800">{c.certificateNumber}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Issue Date:</span>
                    <span className="text-slate-700">{new Date(c.issueDate).toLocaleDateString()}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Expiration:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(c.expiryDate).toLocaleDateString()}
                    </span>
                  </p>
                  <p
                    className={`font-semibold text-right ${
                      c.daysUntilExpiry <= 0
                        ? 'text-rose-600'
                        : c.daysUntilExpiry <= 30
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {c.daysUntilExpiry <= 0
                      ? 'Expired (Renewal Required)'
                      : `${c.daysUntilExpiry} days remaining`}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {c.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by Manager
                  </span>
                ) : (
                  <span className="text-amber-600 text-[11px] font-medium">Pending Review</span>
                )}

                {c.fileUrl && (
                  <a
                    href={getAssetUrl(c.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View File</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Certificate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Professional Certificate Proof"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Certification Program
            </label>
            <select
              required
              value={certificationId}
              onChange={e => setCertificationId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Choose program...</option>
              {catalog.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.issuer})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certificate / License Number
            </label>
            <input
              type="text"
              required
              value={certificateNumber}
              onChange={e => setCertificateNumber(e.target.value)}
              placeholder="e.g. AWS-SAA-904812"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Proof Document (PDF, JPG, PNG)
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
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {uploading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
