import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldCheck, Sparkles, User, MapPin } from 'lucide-react';

export default function StudentBadgeModal({ student, onClose }) {
  if (!student) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cert-modal-overlay">
      <div className="glass-card modal-card max-w-md w-full rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl relative cert-modal-card">
        
        {/* Header toolbar */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between cert-modal-header">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-bold text-base">Official Symposium Ticket Badge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 printable-content">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 text-center relative overflow-hidden shadow-xl space-y-4">
            
            {/* Symposium Top Banner */}
            <div className="border-b border-indigo-500/30 pb-3">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
                NATIONAL LEVEL SYMPOSIUM
              </span>
              <h2 className="text-2xl font-black tracking-wider text-white mt-0.5">
                DATAVERSE <span className="text-indigo-400">2026</span>
              </h2>
              <p className="text-[10px] text-slate-400 italic">Innovate • Inspire • Create</p>
            </div>

            {/* QR Code Centerpiece */}
            <div className="flex justify-center my-2">
              <div className="bg-white p-3 rounded-2xl border-2 border-indigo-400 shadow-xl">
                <QRCodeSVG
                  value={student.symposiumCode || student.email}
                  size={120}
                  level="H"
                />
              </div>
            </div>

            {/* Student Details */}
            <div className="space-y-1.5">
              <div className="inline-block px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-sm tracking-wider border border-indigo-400/40 font-mono">
                CODE: {student.symposiumCode}
              </div>

              <h3 className="text-xl font-extrabold text-white tracking-wide pt-1">
                {student.name || (student.user && student.user.name) || student.email}
              </h3>

              <p className="text-xs text-indigo-300 font-bold">
                {student.department} • Year {student.year}
              </p>

              <p className="text-xs text-slate-300 flex items-center justify-center space-x-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 inline" />
                <span className="font-semibold truncate max-w-[280px]">{student.collegeName}</span>
              </p>
            </div>

            {/* Registered Events List */}
            {student.registeredEvents && student.registeredEvents.length > 0 && (
              <div className="pt-3 border-t border-indigo-500/20 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Registered Events:</p>
                <div className="flex flex-wrap gap-1">
                  {student.registeredEvents.map((ev, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 font-medium">
                      {ev.title || ev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Pass Indicator */}
            <div className="pt-3 border-t border-indigo-500/30 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">STATUS: <strong className="text-emerald-400">{student.verificationStatus || 'APPROVED'}</strong></span>
              <span className="text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 inline" />
                <span>ENTRY GRANTED</span>
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
