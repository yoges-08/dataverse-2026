import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Award, ShieldCheck, Sparkles, Medal, Crown } from 'lucide-react';

export default function CertificateModal({ certificate, onClose }) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = certificate.student?.user?.name || certificate.student?.name || 'Participant';
  const department = certificate.student?.department;
  const collegeName = certificate.student?.collegeName || 'Anjalai Ammal Mahalingam Engineering College';
  const eventTitle = certificate.event?.title || 'DATAVERSE Symposium Event';
  const eventCategory = certificate.event?.category || 'Technical Event';
  const certType = certificate.type || 'Participation';

  const isWinner = certType === 'Winner';
  const isRunnerUp = certType === 'RunnerUp';
  const isParticipation = certType === 'Participation';

  // Trophy = gold, RunnerUp = silver, Participation = indigo
  const theme = isWinner
    ? { accent: '#fbbf24', accentSoft: '#fef3c7', accentBorder: 'rgba(251,191,36,0.55)', bar: 'from-amber-600 via-yellow-500 to-amber-600', text: 'text-amber-300', title: 'CERTIFICATE OF EXCELLENCE', ribbon: 'First Prize Winner', sealText: '#f59e0b' }
    : isRunnerUp
      ? { accent: '#cbd5e1', accentSoft: '#f1f5f9', accentBorder: 'rgba(203,213,225,0.5)', bar: 'from-slate-500 via-slate-300 to-slate-500', text: 'text-slate-300', title: 'CERTIFICATE OF ACHIEVEMENT', ribbon: 'Runner-Up', sealText: '#94a3b8' }
      : { accent: '#818cf8', accentSoft: '#e0e7ff', accentBorder: 'rgba(129,140,248,0.55)', bar: 'from-indigo-600 via-violet-500 to-indigo-600', text: 'text-indigo-300', title: 'CERTIFICATE OF PARTICIPATION', ribbon: isWinner ? 'Winner' : 'Participation', sealText: '#818cf8' };

  const achievementLine = isWinner
    ? `for securing the First Prize and being adjudged WINNER in`
    : isRunnerUp
      ? 'for securing the Runner-Up position in'
      : 'for actively and successfully participating in the';

  const perfWord = isWinner ? 'outstanding' : 'commendable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md cert-modal-overlay">
      <div className="glass-card max-w-2xl w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl relative cert-modal-card">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between cert-modal-header">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-bold text-base">Official Symposium Certificate</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
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
        <div className="p-6 printable-content">
          <div className={`bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-7 sm:p-9 rounded-2xl relative text-center shadow-2xl overflow-hidden`} style={{ border: `3px solid ${theme.accentBorder}`, outline: '1px dashed rgba(255,255,255,0.18)', outlineOffset: '6px' }}>

            {/* Soft radial glow */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${theme.accent}, transparent 70%)` }}
            ></div>

            {/* Corner Ornaments */}
            {[
              'top-2 left-2 border-t-[3px] border-l-[3px]',
              'top-2 right-2 border-t-[3px] border-r-[3px]',
              'bottom-2 left-2 border-b-[3px] border-l-[3px]',
              'bottom-2 right-2 border-b-[3px] border-r-[3px]'
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-9 h-9 pointer-events-none`} style={{ borderColor: theme.accent }}>
                <span className="absolute -right-1 -top-1 w-2 h-2" style={{ background: theme.accent, transform: 'rotate(45deg)' }}></span>
                <span className="absolute -left-1 -bottom-1 w-2 h-2" style={{ background: 'transparent', border: '1px solid ' + theme.accent, transform: 'rotate(45deg)' }}></span>
              </div>
            ))}

            {/* Type ribbon */}
            <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r ${theme.bar} text-white text-[10px] font-extrabold uppercase tracking-widest shadow-lg mb-4`}>
              {isWinner ? <Crown className="w-3.5 h-3.5" /> : isRunnerUp ? <Medal className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
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
              className="text-3xl sm:text-4xl font-black tracking-wide leading-tight"
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
              <span className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent})` }}></span>
              <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
              <span className="h-px w-16" style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}></span>
            </div>

            <p className="text-xs italic text-slate-400">DATAVERSE 2026 • Innovate • Inspire • Create</p>

            {/* Body */}
            <div className="space-y-3 my-5 text-sm text-slate-300">
              <p>This is to proudly certify that</p>
              <h3 className="text-3xl font-black italic text-white" style={{ textShadow: '0 0 24px rgba(255,255,255,0.15)' }}>
                {studentName}
              </h3>

              {/* Department & College */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold">
                {department && (
                  <span className="px-3 py-1 rounded-full border text-white" style={{ borderColor: theme.accentBorder, color: theme.accent }}>
                    {department}
                  </span>
                )}
                {collegeName && (
                  <span className="text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    {collegeName}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mt-2">
                {achievementLine} the event <strong className="text-white">{eventTitle}</strong> ({eventCategory}) conducted by
                the Department of Artificial Intelligence &amp; Data Science at{' '}
                <strong className="text-white">DATAVERSE 2026 — National Symposium</strong> with {perfWord} dedication
                and enthusiasm.
              </p>
            </div>

            {/* Bottom: QR, Cert No, Signature */}
            <div className="flex items-end justify-between pt-5 border-t border-slate-800 mt-5">
              <div className="text-left space-y-1">
                <span className="text-[9px] uppercase text-slate-500 font-bold">Certificate No</span>
                <span className="text-[11px] font-mono font-bold block" style={{ color: theme.accent }}>
                  {certificate.certificateNo}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Issued on {new Date(certificate.issuedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-white p-1.5 rounded-lg shadow-md">
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
                <span className="text-xs font-bold text-white block">Dr. R. K. Varma</span>
                <span className="text-[9px] text-slate-400 block">Convener — DATAVERSE</span>
                <span className="text-[9px] text-slate-500 block">Anjalai Ammal Mahalingam Engineering College</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}