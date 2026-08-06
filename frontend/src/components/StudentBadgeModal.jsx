import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Sparkles, MapPin } from 'lucide-react';

export default function StudentBadgeModal({ student, onClose }) {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card max-w-md w-full rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl relative">
        
        {/* Header toolbar */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-bold text-base">Official Symposium Badge</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 printable-content">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl p-5 border-2 border-indigo-500/40 text-center relative overflow-hidden shadow-xl">
            
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Symposium Top Banner */}
            <div className="border-b border-indigo-500/30 pb-3 mb-4">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
                ANJALAI AMMAL MAHALINGAM ENGG COLLEGE
              </span>
              <h2 className="text-2xl font-black tracking-wider text-white mt-0.5">
                DATAVERSE <span className="text-indigo-400">2026</span>
              </h2>
              <p className="text-[10px] text-slate-400 italic">Innovate • Inspire • Create</p>
            </div>

            {/* Snapshot & QR side-by-side */}
            <div className="flex items-center justify-center space-x-4 my-4">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center border-2 border-indigo-400 shadow-md">
                <span className="text-4xl font-black text-white">
                  {(student.name || (student.user && student.user.name) || student.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-md">
                <QRCodeSVG
                  value={student.symposiumCode || student.registerNumber}
                  size={84}
                  level="H"
                />
              </div>
            </div>

            {/* Student Details */}
            <div className="space-y-1 my-3">
              <h3 className="text-xl font-bold text-white tracking-wide">
                {student.name || (student.user && student.user.name) || student.email}
              </h3>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-xs tracking-wider border border-indigo-400/40">
                CODE: {student.symposiumCode}
              </div>
              <p className="text-xs text-indigo-300 font-semibold mt-1">
                {student.department} • Year {student.year}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-indigo-400 inline" />
                <span className="truncate max-w-[260px]">{student.collegeName}</span>
              </p>
            </div>

            {/* Registered Events List */}
            {student.registeredEvents && student.registeredEvents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-500/20 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Registered Events:</p>
                <div className="flex flex-wrap gap-1">
                  {student.registeredEvents.map((ev, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {ev.title || ev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Pass Indicators */}
            <div className="mt-4 pt-3 border-t border-indigo-500/30 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="text-indigo-300 font-bold">{student.symposiumCode}</span>
              <span className="text-emerald-400 uppercase font-bold">Access Granted</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
