import React, { useState, useEffect } from 'react';
import { certificationApi, getAssetUrl } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Award, FileText, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export const ManagerCertifications: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCerts = async () => {
    try {
      const res = await certificationApi.getEmployeeCertifications();
      if (res.data?.success) setCerts(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await certificationApi.verifyEmployeeCertification(id, verified);
      fetchCerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Team Certification Validity & Verification
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review credentials submitted by direct reports, verify authentications, and anticipate expiration risks
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Certification</th>
                <th className="py-3 px-4">Credential Number</th>
                <th className="py-3 px-4">Validity Horizon</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No certifications registered for your team
                  </td>
                </tr>
              ) : (
                certs.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{c.employee?.name}</span>
                      <p className="text-[11px] text-slate-400">{c.employee?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{c.certification?.name}</span>
                      <p className="text-[11px] text-slate-500">{c.certification?.issuer}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {c.certificateNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px]">
                        <p className="text-slate-500">
                          Expires: {new Date(c.expiryDate).toLocaleDateString()}
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
                            ? 'Expired'
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
                          <span>View Doc</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No file</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerify(c._id, true)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 inline-flex cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verify Proof
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
