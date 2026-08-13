import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { X, Printer, Download, Award, ShieldCheck, Sparkles, Medal, Crown, Star } from 'lucide-react';
import { getStudentName } from '../utils/studentName';

export default function CertificateModal({ certificate, onClose }) {
  const sheetRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!sheetRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(sheetRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${certificate.certificateNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download certificate failed:', err);
      alert('Could not download the certificate. Please use Print -> Save as PDF instead.');
    } finally {
      setDownloading(false);
    }
  };

  const studentName = getStudentName(certificate.student, 'Participant');
  const department = certificate.student?.department;
  const collegeName = certificate.student?.collegeName || 'Anjalai Ammal Mahalingam Engineering College';
  const eventTitle = certificate.event?.title || 'DATAVERSE Symposium Event';
  const eventCategory = certificate.event?.category || 'Technical Event';
  const certType = certificate.type || 'Participation';

  const isWinner = certType === 'Winner';
  const isRunnerUp = certType === 'RunnerUp';
  const isThird = certType === 'Third';
  const isParticipation = certType === 'Participation';

  // White-themed certificate: darker accents so text stays readable on white.
  const theme = isWinner
    ? { accent: '#b45309', accentSoft: '#fde68a', accentBorder: 'rgba(217,119,6,0.5)', bar: 'from-amber-600 via-yellow-500 to-amber-600', title: 'CERTIFICATE OF EXCELLENCE', ribbon: 'First Prize Winner' }
    : isRunnerUp
      ? { accent: '#64748b', accentSoft: '#e2e8f0', accentBorder: 'rgba(100,116,139,0.5)', bar: 'from-slate-500 via-slate-400 to-slate-500', title: 'CERTIFICATE OF ACHIEVEMENT', ribbon: 'Second Prize Winner' }
      : isThird
        ? { accent: '#a15d2e', accentSoft: '#f7e0c8', accentBorder: 'rgba(161,93,46,0.5)', bar: 'from-amber-700 via-orange-600 to-amber-700', title: 'CERTIFICATE OF ACHIEVEMENT', ribbon: 'Third Prize Winner' }
        : { accent: '#6366f1', accentSoft: '#e0e7ff', accentBorder: 'rgba(99,102,241,0.5)', bar: 'from-indigo-600 via-violet-500 to-indigo-600', title: 'CERTIFICATE OF PARTICIPATION', ribbon: 'Participation' };

  const achievementLine = isWinner
    ? `for securing the First Prize and being adjudged WINNER in`
    : isRunnerUp
      ? 'for securing the Second Prize (Runner-Up) position in'
      : isThird
        ? 'for securing the Third Prize position in'
        : 'for actively and successfully participating in the';

  const perfWord = isWinner ? 'outstanding' : 'commendable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md cert-modal-overlay">
      <div className="glass-card max-w-2xl w-full rounded-2xl border border-amber-500/30 shadow-2xl relative cert-modal-card max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3 cert-modal-header flex-wrap">
          <div className="flex items-center space-x-2 min-w-0">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-white font-bold text-sm sm:text-base truncate">Official Symposium Certificate</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download Image'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-6 printable-content">
          <div
            ref={sheetRef}
            className="certificate-sheet relative text-center rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-9"
            style={{
              background: 'linear-gradient(155deg, #ffffff 0%, #f8fafc 45%, #eef2ff 100%)',
              border: `3px solid ${theme.accentBorder}`,
              outline: '1px dashed rgba(100,116,139,0.35)',
              outlineOffset: '6px'
            }}
          >

            {/* Soft radial glow */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${theme.accent}, transparent 70%)` }}
            ></div>

            {/* Corner Ornaments */}
            {[
              'top-2 left-2 border-t-[3px] border-l-[3px]',
              'top-2 right-2 border-t-[3px] border-r-[3px]',
              'bottom-2 left-2 border-b-[3px] border-l-[3px]',
              'bottom-2 right-2 border-b-[3px] border-r-[3px]'
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-8 h-8 sm:w-9 sm:h-9 pointer-events-none`} style={{ borderColor: theme.accent }}>
                <span className="absolute -right-1 -top-1 w-2 h-2" style={{ background: theme.accent, transform: 'rotate(45deg)' }}></span>
                <span className="absolute -left-1 -bottom-1 w-2 h-2" style={{ background: 'transparent', border: '1px solid ' + theme.accent, transform: 'rotate(45deg)' }}></span>
              </div>
            ))}

            {/* Type ribbon */}
            <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r ${theme.bar} text-[10px] font-extrabold uppercase tracking-widest shadow-lg mb-4`} style={{ color: '#ffffff' }}>
              {isWinner ? <Crown className="w-3.5 h-3.5" /> : isRunnerUp ? <Medal className="w-3.5 h-3.5" /> : isThird ? <Star className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              {theme.ribbon}
            </div>

            {/* College header */}
            <div className="space-y-1 mb-5">
              <span className="text-[10px] uppercase font-bold tracking-[0.22em]" style={{ color: theme.accent }}>
                Anjalai Ammal Mahalingam Engineering College, Kovilvenni
              </span>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                Department of Artificial Intelligence & Data Science
              </p>
            </div>

            {/* Title */}
            <h2
              className="text-2xl sm:text-3xl font-black tracking-wider leading-tight px-2 break-words"
              style={{
                background: `linear-gradient(90deg, ${theme.accentSoft}, ${theme.accent}, ${theme.accentSoft})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {theme.title}
            </h2>

            <div className="flex items-center justify-center gap-3 my-4">
              <span className="h-px w-12 sm:w-16" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent})` }}></span>
              <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
              <span className="h-px w-12 sm:w-16" style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}></span>
            </div>

            <p className="text-xs italic text-slate-600">DATAVERSE 2026 • Innovate • Inspire • Create</p>

            {/* Body */}
            <div className="space-y-3 my-5 text-sm text-slate-700">
              <p>This is to proudly certify that</p>
              <h3 className="text-2xl sm:text-3xl font-black italic text-slate-900 break-words leading-snug px-2">
                {studentName}
              </h3>

              {/* Department & College */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold">
                {department && (
                  <span className="px-3 py-1 rounded-full border" style={{ borderColor: theme.accentBorder, color: theme.accent }}>
                    {department}
                  </span>
                )}
                {collegeName && (
                  <span className="text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    {collegeName}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 max-w-md mx-auto leading-relaxed mt-2">
                {achievementLine} the event <strong className="text-slate-900">{eventTitle}</strong> ({eventCategory}) conducted by
                the Department of Artificial Intelligence &amp; Data Science at{' '}
                <strong className="text-slate-900">DATAVERSE 2026 — National Symposium</strong> with {perfWord} dedication
                and enthusiasm.
              </p>
            </div>

            {/* Bottom: Cert No, QR, Signature */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 pt-5 border-t border-slate-200 mt-5">
              <div className="text-left space-y-1">
                <span className="text-[9px] uppercase text-slate-500 font-bold">Certificate No</span>
                <span className="text-[11px] font-mono font-bold block" style={{ color: theme.accent }}>
                  {certificate.certificateNo}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Issued on {new Date(certificate.issuedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-white p-1.5 rounded-lg shadow-md border border-slate-200 mx-auto sm:mx-0">
                <QRCodeSVG
                  value={certificate.certificateNo}
                  size={58}
                  fgColor="#0f172a"
                />
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.accent }}>
                  <ShieldCheck className="w-3 h-3" /> Verified &amp; Authentic
                </div>
                <div className="w-28 h-0.5 mb-1 ml-auto" style={{ background: theme.accent }}></div>
                <span className="text-xs font-bold text-slate-900 block">Dr. G. Nanthakumar</span>
                <span className="text-[9px] text-slate-600 block">Convener — DATAVERSE</span>
                <span className="text-[9px] text-slate-500 block">Anjalai Ammal Mahalingam Engineering College</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
