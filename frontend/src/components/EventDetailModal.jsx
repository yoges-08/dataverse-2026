import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Calendar, Clock, MapPin, Trophy, UserCheck, AlertCircle, FileText, Upload, Sparkles } from 'lucide-react';
import API from '../services/api';

export default function EventDetailModal({ event, onClose, onRegisterSuccess }) {
  const { user, student } = useContext(AuthContext);
  const [paperFile, setPaperFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!event) return null;

  const handleRegister = async () => {
    if (!user) {
      setMsg({ type: 'error', text: 'Please log in to register for events.' });
      return;
    }

    if (user.role !== 'student') {
      setMsg({ type: 'error', text: 'Only registered student accounts can register for symposium events.' });
      return;
    }

    if (event.pdfRequired && !paperFile) {
      setMsg({ type: 'error', text: 'Please select your paper presentation PDF file.' });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });

      const formData = new FormData();
      if (paperFile) {
        formData.append('paperPdf', paperFile);
      }

      const res = await API.post(`/events/${event._id}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        if (onRegisterSuccess) onRegisterSuccess(event._id);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to register for event.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-card max-w-2xl w-full rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl relative">
        
        {/* Banner Header */}
        <div className="relative h-48 bg-slate-900">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                event.category === 'Technical'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
              }`}>
                {event.category} Event
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{event.title}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacity</span>
              <span className="text-sm font-bold text-indigo-400">{event.currentRegistrations} / {event.maxParticipants}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>

          {/* Key Event Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Date</span>
                <span className="text-xs font-semibold text-white">{event.date}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Time</span>
                <span className="text-xs font-semibold text-white">{event.time}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-2.5 col-span-2 sm:col-span-1">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Venue</span>
                <span className="text-xs font-semibold text-white truncate max-w-[130px]">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Rules */}
          {event.rules && event.rules.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Event Rules & Guidelines</h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {event.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prizes */}
          <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1 mb-2">
              <Trophy className="w-4 h-4" />
              <span>Prize Pool Breakdown</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold block">1st Prize</span>
                <span className="font-semibold text-white">{event.prizes?.first}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">2nd Prize</span>
                <span className="font-semibold text-white">{event.prizes?.second}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">3rd Prize</span>
                <span className="font-semibold text-white">{event.prizes?.third}</span>
              </div>
            </div>
          </div>

          {/* Coordinators */}
          <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Coordinator</span>
              <span className="font-semibold text-white">{event.facultyCoordinator?.name}</span>
              <span className="block text-indigo-400 font-mono">{event.facultyCoordinator?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Coordinator</span>
              <span className="font-semibold text-white">{event.studentCoordinator?.name}</span>
              <span className="block text-indigo-400 font-mono">{event.studentCoordinator?.phone}</span>
            </div>
          </div>

          {/* PDF Upload for Paper Presentation */}
          {event.pdfRequired && (
            <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-2">
              <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4" />
                <span>Upload Paper Presentation Abstract (.pdf mandatory)</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPaperFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>
          )}

          {/* Message feedback */}
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing Registration...' : 'Register For Event'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
