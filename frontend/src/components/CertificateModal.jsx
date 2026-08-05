import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Award, ShieldCheck, Sparkles } from 'lucide-react';

export default function CertificateModal({ certificate, onClose }) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = certificate.student?.user?.name || certificate.student?.name || 'Participant';
  const eventTitle = certificate.event?.title || 'DATAVERSE Symposium Event';
  const collegeName = certificate.student?.collegeName || 'Anjalai Ammal Mahalingam Engineering College';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-card max-w-2xl w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
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
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 rounded-2xl border-4 border-amber-500/40 relative text-center shadow-2xl overflow-hidden">
            
            {/* Corner Ornaments */}
            <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-amber-400"></div>
            <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-amber-400"></div>
            <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-amber-400"></div>
            <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-amber-400"></div>

            {/* Title */}
            <div className="space-y-1 mb-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                ANJALAI AMMAL MAHALINGAM ENGINEERING COLLEGE, KOVILVENNI
              </span>
              <h2 className="text-3xl font-black text-amber-200 tracking-wider">
                CERTIFICATE OF {certificate.type === 'Winner' ? 'EXCELLENCE' : 'PARTICIPATION'}
              </h2>
              <p className="text-xs text-slate-400 italic">DATAVERSE 2026 • Innovate • Inspire • Create</p>
            </div>

            {/* Body Text */}
            <div className="space-y-4 my-6 text-sm text-slate-300">
              <p>This is to certify that</p>
              <h3 className="text-2xl font-black text-white underline decoration-amber-400 decoration-2 underline-offset-4">
                {studentName}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                from <strong className="text-white">{collegeName}</strong> has actively participated and secured 
                <strong className="text-amber-300 font-bold"> {certificate.type === 'Winner' ? 'First Prize' : 'Honorable Mention'} </strong> 
                in the event <strong className="text-white">{eventTitle}</strong> at DATAVERSE 2026.
              </p>
            </div>

            {/* QR Code & Certificate No */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">Certificate No:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{certificate.certificateNo}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Issued on: {new Date(certificate.issuedAt || Date.now()).toLocaleDateString()}</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-md">
                <QRCodeSVG
                  value={certificate.certificateNo}
                  size={64}
                />
              </div>

              <div className="text-right">
                <div className="w-24 h-0.5 bg-amber-400 mb-1 ml-auto"></div>
                <span className="text-xs font-bold text-white block">Dr. R. K. Varma</span>
                <span className="text-[10px] text-slate-400 block">Convener - DATAVERSE</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
