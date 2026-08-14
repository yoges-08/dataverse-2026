import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Search, X, Camera, ShieldCheck, AlertCircle, Sparkles, UserCheck, User } from 'lucide-react';
import API from '../services/api';

export default function QRScannerModal({ onClose, onVerifySuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [alreadyCheckedInInfo, setAlreadyCheckedInInfo] = useState(null);

  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: Math.min(250, (typeof window !== 'undefined' ? window.innerWidth : 320) - 72), height: Math.min(250, (typeof window !== 'undefined' ? window.innerWidth : 320) - 72) }
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScanning(false);
          handleVerify(decodedText);
        },
        (error) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner clear error", err));
      }
    };
  }, [scanning]);

  const handleVerify = async (codeToVerify) => {
    const queryCode = codeToVerify || manualCode;
    if (!queryCode.trim()) {
      setErrorMsg('Please enter or scan a valid student ticket code');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setAlreadyCheckedInInfo(null);

      const res = await API.post('/attendance/verify', { code: queryCode });
      if (res.data.success) {
        setVerifiedStudent(res.data.student);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Student registration not found or invalid code');
      setVerifiedStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformCheckIn = async () => {
    if (!verifiedStudent) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.post('/attendance/check-in', {
        studentId: verifiedStudent.id,
        gate: 'Main Entrance Gate A',
        deviceInfo: 'Volunteer Web Terminal'
      });

      if (res.data.success) {
        setVerifiedStudent(prev => ({
          ...prev,
          isCheckedIn: true,
          checkInTime: new Date().toISOString()
        }));
        if (onVerifySuccess) {
          onVerifySuccess(res.data.student);
        }
      }
    } catch (err) {
      if (err.response?.data?.alreadyCheckedIn) {
        setAlreadyCheckedInInfo(err.response.data.message);
      } else {
        setErrorMsg(err.response?.data?.message || 'Check-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-card modal-card max-w-xl w-full rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-bold text-base">QR Ticket Verification Terminal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          
          {/* Quick Demo Test Codes */}
          <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/20 text-xs">
            <span className="font-semibold text-indigo-300 block mb-1">Quick Sample Test Codes:</span>
            <div className="flex flex-wrap gap-2">
              {['DV2026-REG-1001', 'DV2026-REG-1002', 'DV2026-REG-1003', 'DV2026-SPOT-2001'].map(code => (
                <button
                  key={code}
                  onClick={() => {
                    setManualCode(code);
                    handleVerify(code);
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 text-[11px] font-mono"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Search */}
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Enter Ticket Code (DV2026-REG-1001) or Email..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Verify
            </button>
          </form>

          {/* Camera Scanner View */}
          {scanning && !verifiedStudent && (
            <div className="text-center">
              <div id="reader" className="rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-900 max-w-[320px] mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2">Point webcam at student QR code pass</p>
            </div>
          )}

          {!scanning && !verifiedStudent && (
            <button
              onClick={() => setScanning(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700"
            >
              <Camera className="w-4 h-4" />
              <span>Re-activate Camera QR Scanner</span>
            </button>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verification Results Display */}
          {verifiedStudent && (
            <div className="bg-slate-900 rounded-xl p-5 border border-indigo-500/40 space-y-4">
              
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{verifiedStudent.name}</h4>
                    <span className="text-xs text-indigo-400 font-mono font-bold">{verifiedStudent.symposiumCode}</span>
                    <p className="text-xs text-slate-400">{verifiedStudent.email}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  verifiedStudent.verificationStatus === 'Approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {verifiedStudent.verificationStatus}
                </span>
              </div>

              {/* Institution & Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">College Name:</span>
                  <span className="text-white font-semibold">{verifiedStudent.collegeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department:</span>
                  <span className="text-white font-medium">{verifiedStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Year of Study:</span>
                  <span className="text-indigo-300 font-semibold">Year {verifiedStudent.year}</span>
                </div>
              </div>

              {/* Duplicate check-in notice */}
              {alreadyCheckedInInfo && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{alreadyCheckedInInfo}</span>
                </div>
              )}

              {/* Check-In Action Button */}
              {verifiedStudent.isCheckedIn ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center font-semibold text-xs flex items-center justify-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>STUDENT CHECKED IN ({new Date(verifiedStudent.checkInTime).toLocaleTimeString()})</span>
                </div>
              ) : (
                <button
                  onClick={handlePerformCheckIn}
                  disabled={loading || verifiedStudent.verificationStatus !== 'Approved'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-[background-color,transform] duration-200 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Confirm Student Check-In & Grant Entry</span>
                </button>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
