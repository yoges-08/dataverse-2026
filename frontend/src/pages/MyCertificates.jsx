import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CertificateModal from '../components/CertificateModal';
import API from '../services/api';
import {
  Award, Download, AlertCircle, ArrowLeft, ShieldCheck, Calendar
} from 'lucide-react';

export default function MyCertificates() {
  const { user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await API.get('/certificates/my-certificates');
        if (res.data.success) {
          setCertificates(res.data.certificates || []);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load your certificates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadCertificates();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">My Certificates</h1>
            <p className="text-xs text-slate-400 mt-1">
              Official DATAVERSE 2026 certificates issued to {user?.name || 'you'}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/student"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400 text-sm">
          Loading your certificates...
        </div>
      ) : certificates.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400 space-y-3">
          <Award className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
          <p className="text-sm font-bold text-white">No certificates yet</p>
          <p className="text-xs leading-relaxed max-w-md mx-auto">
            Certificates are issued after event verification and completion by event coordinators.
            Once issued, they will appear here and you can download them as PDF.
          </p>
          <Link
            to="/events"
            className="inline-block mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          {/* Verified banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              All certificates displayed below are digitally verifiable. Each one carries a unique
              certificate number you can verify publicly on the{' '}
              <Link to="/verify" className="font-bold underline">Certificate Verification</Link> page.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="glass-card p-5 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">
                    {cert.type} Certificate
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                    {cert.event?.title || 'Symposium Event'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{cert.certificateNo}</p>
                  <span className="text-[10px] text-slate-500 block mt-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 inline" />
                    <span>Issued {new Date(cert.issuedAt || Date.now()).toLocaleDateString()}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors shrink-0"
                  title="View & Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
