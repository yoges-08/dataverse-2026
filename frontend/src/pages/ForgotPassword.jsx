import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '', token: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMsg({
          type: 'success',
          text: res.data.message,
          token: res.data.demoToken
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
          <h1 className="text-3xl font-black text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">Enter your registered email to receive an OTP code</p>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl text-xs space-y-2 ${
            msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            <p>{msg.text}</p>
            {msg.token && (
              <p className="font-mono bg-slate-900 p-2 rounded text-amber-300 font-bold">
                Verification OTP Token: {msg.token}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
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
            {loading ? 'Sending Request...' : 'Send Password Reset OTP'}
          </button>
        </form>

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
