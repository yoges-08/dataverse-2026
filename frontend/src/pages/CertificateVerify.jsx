import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { Award, ShieldCheck, Search, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CertificateVerify() {
  const { certNo } = useParams();
  const [queryNo, setQueryNo] = useState(certNo || '');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (certNo) {
      handleLookup(certNo);
    }
  }, [certNo]);

  const handleLookup = async (numberToVerify) => {
    const code = numberToVerify || queryNo;
    if (!code.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/certificates/verify/${code.trim()}`);
      if (res.data.success) {
        setCertificate(res.data.certificate);
      }
    } catch (err) {
      setCertificate(null);
      setErrorMsg(err.response?.data?.message || 'Certificate number not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Award className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black text-white">Public Certificate Verification</h1>
        <p className="text-xs text-slate-400">Validate the authenticity of DATAVERSE 2026 participation & award certificates.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Certificate Number (e.g. CERT-DV2026-981420)..."
            value={queryNo}
            onChange={(e) => setQueryNo(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
          >
            Verify
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {certificate && (
        <div className="glass-card p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>VERIFIED AUTHENTIC CERTIFICATE</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-amber-400 font-bold block">{certificate.certificateNo}</span>
            <h3 className="text-2xl font-black text-white">
              {certificate.student?.user?.name || certificate.student?.name || 'Participant'}
            </h3>
            <p className="text-xs text-slate-300">
              {certificate.student?.collegeName} • {certificate.student?.department}
            </p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Event & Award:</span>
            <p className="font-bold text-amber-300">{certificate.event?.title || 'Symposium Event'} ({certificate.type})</p>
            <p className="text-slate-400 text-[10px]">Issued by Anjalai Ammal Mahalingam Engineering College on {new Date(certificate.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}

    </div>
  );
}
