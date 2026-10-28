import React, { useState, useEffect } from 'react';
import { certificationApi, getAssetUrl } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Award, Plus, CheckCircle, FileText, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';

export const AdminCertifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'CATALOG'>('EMPLOYEE');
  const [employeeCerts, setEmployeeCerts] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Catalog Modal
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [validityMonths, setValidityMonths] = useState(24);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud & Infrastructure');

  const fetchData = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        certificationApi.getEmployeeCertifications(),
        certificationApi.getCertifications(),
      ]);
      if (eRes.data?.success) setEmployeeCerts(eRes.data.data || []);
      if (cRes.data?.success) setCatalog(cRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await certificationApi.verifyEmployeeCertification(id, verified);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await certificationApi.createCertification({
        name: catName,
        issuer,
        validityPeriod: validityMonths,
        description,
        category,
      });
      setIsCatalogModalOpen(false);
      setCatName('');
      setIssuer('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add certification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Certification & Validity Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit regulatory credentials, verify employee uploaded proofs, and track validity windows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('EMPLOYEE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employee Credentials ({employeeCerts.length})
            </button>
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'CATALOG'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Catalog ({catalog.length})
            </button>
          </div>

          {activeTab === 'CATALOG' && (
            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Catalog
            </button>
          )}
        </div>
      </div>

      {activeTab === 'EMPLOYEE' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Certification</th>
                  <th className="py-3 px-4">Credential Number</th>
                  <th className="py-3 px-4">Dates & Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Proof File</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeCerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No employee certifications on record
                    </td>
                  </tr>
                ) : (
                  employeeCerts.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{c.employee?.name}</span>
                        <p className="text-[11px] text-slate-400 font-mono">{c.employee?.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {c.certification?.name}
                        </span>
                        <p className="text-[11px] text-slate-500">{c.certification?.issuer}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {c.certificateNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] space-y-0.5">
                          <p>
                            <span className="text-slate-400">Issued:</span>{' '}
                            {new Date(c.issueDate).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="text-slate-400">Expires:</span>{' '}
                            <strong className="text-slate-900">
                              {new Date(c.expiryDate).toLocaleDateString()}
                            </strong>
                          </p>
                          <p
                            className={`font-semibold ${
                              c.daysUntilExpiry <= 0
                                ? 'text-rose-600'
                                : c.daysUntilExpiry <= 30
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {c.daysUntilExpiry <= 0
                              ? `Expired (${Math.abs(c.daysUntilExpiry)} days ago)`
                              : `${c.daysUntilExpiry} days remaining`}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {c.fileUrl ? (
                          <a
                            href={getAssetUrl(c.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Proof Doc</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No file attached</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.verified ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verified
                            </span>
                            <button
                              onClick={() => handleVerify(c._id, false)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 underline ml-1 cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerify(c._id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Verify
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map(c => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {c.validityPeriod} Months validity
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">Issuer: {c.issuer}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{c.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Category: <strong className="text-slate-700">{c.category || 'General'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Catalog Modal */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Add Certification Definition to Catalog"
      >
        <form onSubmit={handleCreateCatalog} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certification Name
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={e => setCatName(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issuer / Authority</label>
              <input
                type="text"
                required
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Validity Period (Months)
              </label>
              <input
                type="number"
                min={1}
                value={validityMonths}
                onChange={e => setValidityMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Competencies validated by this credential..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Save to Catalog
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
