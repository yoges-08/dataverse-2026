import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '', devOtp: '', emailStatus: null });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMsg({
          type: 'success',
          text: 'Verification OTP has been generated & dispatched to your email address.',
          devOtp: res.data.devOtp,
          emailStatus: res.data.emailStatus
        });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error requesting reset OTP' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Forgot Password</h1>
          <p className="text-xs text-slate-400">Enter your registered email address to receive a 6-digit reset OTP</p>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl text-xs space-y-3 ${
            msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            <p className="font-semibold">{msg.text}</p>
            
            {/* Delivery notice */}
            {msg.emailStatus && !msg.emailStatus.delivered && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[11px]">
                ℹ️ Note: Live SMTP email delivery is unconfigured in this environment. Use the test OTP below.
              </div>
            )}

            {/* Test OTP display in dev */}
            {msg.devOtp && (
              <div className="p-2.5 bg-slate-900 rounded-lg text-center border border-indigo-500/30">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Dev Test Verification OTP:</span>
                <span className="text-xl font-mono font-bold text-amber-300 tracking-widest">{msg.devOtp}</span>
              </div>
            )}

            {msg.type === 'success' && (
              <button
                onClick={() => navigate('/reset-password', { state: { email, token: msg.devOtp || '' } })}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Proceed to Enter OTP & Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {!msg.devOtp && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@aamec.edu.in"
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating OTP...' : 'Send Password Reset OTP'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
