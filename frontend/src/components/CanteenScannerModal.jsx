import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  X, Camera, Salad, CheckCircle2, AlertCircle, 
  Search, ShieldAlert, Clock, User, Building2, RefreshCw
} from 'lucide-react';
import API from '../services/api';

// Web Audio API feedback for noisy canteen environments
export const playFoodAudioFeedback = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Pleasant high double chime (Ding-Dong)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Deep warning buzz (Duplicate or Invalid)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    // Audio context may be restricted or unsupported
  }
};

export default function CanteenScannerModal({ onClose, onScanSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null); // { status: 'approved' | 'already_served' | 'error', message, student }
  const [cooldown, setCooldown] = useState(0);

  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "canteen-qr-reader",
        {
          fps: 10,
          qrbox: { 
            width: Math.min(260, (typeof window !== 'undefined' ? window.innerWidth : 320) - 64), 
            height: Math.min(260, (typeof window !== 'undefined' ? window.innerWidth : 320) - 64) 
          }
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          const now = Date.now();
          if (processingRef.current) return;
          if (decodedText === lastScannedCodeRef.current && (now - lastScannedTimeRef.current < 3500)) {
            return; // Ignore repetitive triggers within 3.5 seconds
          }
          lastScannedCodeRef.current = decodedText;
          lastScannedTimeRef.current = now;
          processFoodScan(decodedText);
        },
        (error) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Canteen Scanner clear error", err));
      }
    };
  }, [scanning]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const processFoodScan = async (codeToVerify) => {
    const rawCode = (codeToVerify || manualCode || '').trim();
    if (!rawCode) return;

    processingRef.current = true;
    setLoading(true);

    try {
      const res = await API.post('/attendance/food-scan', { code: rawCode });
      if (res.data.success) {
        playFoodAudioFeedback('success');
        setScanResult({
          status: 'approved',
          message: res.data.message || '1 Veg Meal Approved!',
          student: res.data.student
        });
        setCooldown(3);
        if (onScanSuccess) {
          onScanSuccess(res.data.student);
        }
      }
    } catch (err) {
      playFoodAudioFeedback('error');
      const data = err.response?.data;
      if (data?.alreadyServed) {
        setScanResult({
          status: 'already_served',
          message: data.message || 'Meal already collected!',
          student: data.student
        });
      } else {
        setScanResult({
          status: 'error',
          message: data?.message || 'Student not found or invalid scan code.',
          student: null
        });
      }
      setCooldown(3);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const resetResult = () => {
    setScanResult(null);
    setManualCode('');
    lastScannedCodeRef.current = '';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-card modal-card max-w-xl w-full rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Salad className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-base flex items-center gap-1.5">
                <span>Canteen Veg Food Scanner</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pure Veg Lunch
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Scan student pass to verify &amp; serve 1 meal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* ACTIVE SCAN RESULT BANNER */}
          {scanResult && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all animate-fadeIn ${
              scanResult.status === 'approved'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xl shadow-emerald-900/40'
                : scanResult.status === 'already_served'
                ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-xl shadow-rose-900/40'
                : 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-xl shadow-amber-900/40'
            }`}>
              <div className="flex items-start space-x-3">
                {scanResult.status === 'approved' && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {scanResult.status === 'already_served' && (
                  <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
                )}
                {scanResult.status === 'error' && (
                  <AlertCircle className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      scanResult.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : scanResult.status === 'already_served'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {scanResult.status === 'approved'
                        ? '✓ Meal Approved (1 Veg Lunch)'
                        : scanResult.status === 'already_served'
                        ? '⛔ Duplicate Blocked (Already Claimed)'
                        : '⚠️ Unregistered / Invalid'}
                    </span>
                    <button
                      onClick={resetResult}
                      className="text-xs opacity-75 hover:opacity-100 underline text-slate-300"
                    >
                      Clear
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                    {scanResult.message}
                  </p>

                  {scanResult.student && (
                    <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="opacity-70 text-[10px] block">Student:</span>
                        <span className="font-bold text-white truncate block">{scanResult.student.name}</span>
                      </div>
                      <div>
                        <span className="opacity-70 text-[10px] block">Pass Code:</span>
                        <span className="font-mono font-bold text-emerald-400">{scanResult.student.symposiumCode}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="opacity-70 text-[10px] block">College / Dept:</span>
                        <span className="text-white truncate block">{scanResult.student.collegeName} ({scanResult.student.department})</span>
                      </div>
                      {scanResult.student.foodServedAt && (
                        <div className="sm:col-span-2 flex items-center space-x-1.5 opacity-90 text-[11px] mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Served at {new Date(scanResult.student.foodServedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {scanResult.student.foodServedBy ? ` by ${scanResult.student.foodServedBy}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ready for next badge button */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={resetResult}
                      className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                        scanResult.status === 'approved'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      Scan Next Student {cooldown > 0 ? `(${cooldown}s)` : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Viewfinder */}
          {scanning ? (
            <div className="text-center space-y-2">
              <div id="canteen-qr-reader" className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-900 max-w-[320px] mx-auto"></div>
              <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Point camera at student QR code pass for instant scan</span>
              </p>
            </div>
          ) : (
            <button
              onClick={() => setScanning(true)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center justify-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Turn On Camera Scanner</span>
            </button>
          )}

          {/* Manual Input (Code or Phone) */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              Or enter Symposium Code / 10-Digit Mobile Number:
            </span>
            <form onSubmit={(e) => { e.preventDefault(); processFoodScan(); }} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. DV2026-REG-1001 or 9876543210"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
              >
                <Salad className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Serve Meal'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-900/60 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
            <span>Canteen Terminal Online</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Close Terminal
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
