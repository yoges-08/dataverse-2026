import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { X, Download, Award, ShieldCheck, Sparkles, Medal, Crown, Star } from 'lucide-react';
import { getStudentName } from '../utils/studentName';

// The certificate is designed at a fixed landscape size and then scaled to fit
// the screen (so it keeps its proper certificate shape on mobile too).
const DESIGN_W = 800;
const DESIGN_H = 566;

export default function CertificateModal({ certificate, onClose }) {
  const sheetRef = useRef(null);
  const wrapRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !certificate) return;
    const update = () => setScale(Math.min(1, el.clientWidth / DESIGN_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certificate]);

  if (!certificate) return null;

  const handleDownload = async () => {
    if (!sheetRef.current) return;
    setDownloading(true);
    try {
      // Compensate the display scale so the exported PNG is always the full
      // design size (800x566 @2x = 1600x1132 px), crisp on any device.
      const dataUrl = await toPng(sheetRef.current, {
        pixelRatio: (2 / Math.max(scale, 0.1)).toFixed(2),
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${certificate.certificateNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download certificate failed:', err);
      alert('Could not download the certificate. Please try again.');
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
      <div className="glass-card modal-card max-w-[840px] w-full rounded-2xl border border-amber-500/30 shadow-2xl relative cert-modal-card max-h-[94vh] overflow-y-auto">

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
              className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download Certificate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-6 printable-content">
          <div ref={wrapRef} className="w-full">
            <div style={{ position: 'relative', height: Math.round(DESIGN_H * scale) }}>
<div
                  ref={sheetRef}
                  className="certificate-sheet relative text-center overflow-hidden"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: DESIGN_W,
                    height: DESIGN_H,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: 'linear-gradient(165deg, #ffffff 0%, #fafbff 42%, #eef2fb 100%)',
                    border: `2.5px solid ${theme.accentBorder}`,
                    outline: '1px solid rgba(148,163,184,0.35)',
                    outlineOffset: '6px',
                    borderRadius: 14
                  }}
                >
                  {/* Soft paper sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.98), rgba(255,255,255,0) 55%)' }}
                  ></div>

                  {/* Watermark emblem (left) + (right) */}
                  <img src="/cert-right.png" alt="" className="absolute -left-6 -bottom-10 w-40 opacity-[0.06] pointer-events-none" />
                  <img src="/cert-left.png" alt="" className="absolute -right-6 -bottom-10 w-40 opacity-[0.06] pointer-events-none" />

                  {/* Double decorative frame */}
                  <div
                    className="absolute inset-4 pointer-events-none rounded-xl"
                    style={{ border: `1.5px solid ${theme.accent}`, boxShadow: `inset 0 0 0 4px #ffffff, inset 0 0 0 5px ${theme.accentBorder}` }}
                  ></div>
                  <div className="absolute inset-6 pointer-events-none rounded-lg" style={{ border: '1px solid rgba(148,163,184,0.4)' }}></div>

                  {/* Top + bottom accent hairlines */}
                  <div className="absolute inset-x-12 top-0 h-[3px] pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}></div>
                  <div className="absolute inset-x-12 bottom-0 h-[3px] pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}></div>

                  {/* Corner flourishes */}
                  {[
                    'top-6 left-6 border-t-[3px] border-l-[3px] rounded-tl-lg',
                    'top-6 right-6 border-t-[3px] border-r-[3px] rounded-tr-lg',
                    'bottom-6 left-6 border-b-[3px] border-l-[3px] rounded-bl-lg',
                    'bottom-6 right-6 border-b-[3px] border-r-[3px] rounded-br-lg'
                  ].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-9 h-9 pointer-events-none`} style={{ borderColor: theme.accent }}>
                      <span className="absolute -right-1 -top-1 w-2 h-2" style={{ background: theme.accent }}></span>
                      <span className="absolute -left-1 -bottom-1 w-2 h-2" style={{ background: 'transparent', border: '1px solid ' + theme.accent }}></span>
                    </div>
                  ))}

                  <div className="p-8 relative">
                    {/* Type ribbon */}
                    <div className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-gradient-to-r ${theme.bar} text-[10px] font-extrabold uppercase tracking-widest shadow-lg mb-4`} style={{ color: '#ffffff' }}>
                      {isWinner ? <Crown className="w-3.5 h-3.5" /> : isRunnerUp ? <Medal className="w-3.5 h-3.5" /> : isThird ? <Star className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {theme.ribbon}
                    </div>

                    {/* College header with flanking emblems */}
                    <div className="flex items-center justify-center gap-8 mb-3">
                      <img src="/cert-right.png" alt="AI&DS" className="h-[68px] w-[68px] object-contain shrink-0 drop-shadow-lg" />
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-bold tracking-[0.2em]" style={{ color: theme.accent }}>
                          Anjalai Ammal Mahalingam Engineering College, Kovilvenni
                        </span>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                          Department of Artificial Intelligence & Data Science
                        </p>
                      </div>
                      <img src="/cert-left.png" alt="AAMEC" className="h-[68px] w-[68px] object-contain shrink-0 drop-shadow-lg" />
                    </div>

                    {/* Title */}
                    <h2
                      className="text-[34px] font-black italic tracking-tight leading-none px-2 break-words mb-2"
                      style={{
                        background: `linear-gradient(90deg, ${theme.accent} 0%, #0f172a 50%, ${theme.accent} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {theme.title}
                    </h2>

                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-3 my-2.5">
                      <span className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent})` }}></span>
                      <div className="w-2.5 h-2.5 rotate-45" style={{ border: `1.5px solid ${theme.accent}` }}></div>
                      <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                      <div className="w-2.5 h-2.5 rotate-45" style={{ border: `1.5px solid ${theme.accent}` }}></div>
                      <span className="h-px w-20" style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}></span>
                    </div>

                    <p className="text-[10px] italic text-slate-500 mt-1 tracking-wide">DATAVERSE 2026 • Innovate • Inspire • Create</p>

                    {/* Body */}
                    <div className="space-y-2.5 my-3.5 text-sm text-slate-700">
                      <p className="text-[12px] tracking-wide">This is to proudly certify that</p>
                      <div className="inline-block">
                        <h3 className="text-[27px] font-black italic text-slate-900 break-words leading-snug px-3 pb-0.5" style={{ borderBottom: `2px solid ${theme.accentSoft}` }}>
                          {studentName}
                        </h3>
                      </div>

                      {/* Department & College */}
                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold pt-0.5">
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

                      <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed mt-1.5">
                        {achievementLine} the event <strong className="text-slate-900">{eventTitle}</strong> ({eventCategory}) conducted by
                        the Department of Artificial Intelligence &amp; Data Science at{' '}
                        <strong className="text-slate-900">DATAVERSE 2026 — National Symposium</strong> with {perfWord} dedication
                        and enthusiasm.
                      </p>
                    </div>

                    {/* Bottom: Cert No, QR, Signature */}
                    <div className="flex items-end justify-between gap-6 pt-3.5 border-t border-slate-200 mt-3">
                      <div className="text-left space-y-1">
                        <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Certificate No</span>
                        <span className="text-[11px] font-mono font-bold block" style={{ color: theme.accent }}>
                          {certificate.certificateNo}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Issued on {new Date(certificate.issuedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="bg-white p-1.5 rounded-lg shadow-md border border-slate-200">
                        <QRCodeSVG
                          value={certificate.certificateNo}
                          size={56}
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
        </div>

      </div>
    </div>
  );
}
