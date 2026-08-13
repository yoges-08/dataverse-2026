import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, AlertCircle, FileText, Upload, Sparkles, Calendar, Clock, MapPin, User, Plus, UserPlus, CheckCircle2, Trash2, Loader } from 'lucide-react';
import API from '../services/api';

const formatDate = (d) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

export default function EventDetailModal({ event, onClose, onRegisterSuccess }) {
  const { user, student } = useContext(AuthContext);
  const [paperFile, setPaperFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Team members (classmates who are already registered on DATAVERSE)
  const [teamMembers, setTeamMembers] = useState([]);
  const [tmName, setTmName] = useState('');
  const [tmPhone, setTmPhone] = useState('');
  const [tmChecking, setTmChecking] = useState(false);
  const [tmMsg, setTmMsg] = useState({ type: '', text: '' });

  if (!event) return null;

  // 0 (or missing) means solo-only: no teammates for this event.
  const teamLimit = Number.isFinite(event.teamLimit) ? event.teamLimit : 0;

  const removeTeammate = (idx) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTeammate = async () => {
    const name = tmName.trim();
    const digits = tmPhone.replace(/\D/g, '');
    if (!name || !tmPhone.trim()) {
      setTmMsg({ type: 'error', text: 'Enter the classmate name and their 10-digit mobile number.' });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setTmMsg({ type: 'error', text: 'Enter a valid 10-digit mobile number.' });
      return;
    }
    if (teamMembers.length >= teamLimit) {
      setTmMsg({ type: 'error', text: `You can add up to ${teamLimit} teammates for this event.` });
      return;
    }
    if (teamMembers.some((m) => m.phone === digits)) {
      setTmMsg({ type: 'error', text: 'This classmate is already added.' });
      return;
    }

    setTmChecking(true);
    setTmMsg({ type: '', text: '' });
    try {
      const res = await API.get(`/events/teammate/${digits}?eventId=${event._id}`);
      if (res.data.success && res.data.found) {
        const t = res.data.student;
        setTeamMembers((prev) => [
          ...prev,
          { name: t.name, phone: digits, collegeName: t.collegeName, department: t.department }
        ]);
        setTmName('');
        setTmPhone('');
        setTmMsg({ type: 'success', text: `${t.name} verified — added as a teammate.` });
      } else if (res.data.notRegisteredForEvent) {
        setTmMsg({ type: 'error', text: res.data.message || 'This classmate must register for this event before they can be added as a teammate.' });
      } else {
        setTmMsg({ type: 'error', text: 'This classmate is not registered on DATAVERSE. Only registered students can be added as teammates.' });
      }
    } catch (err) {
      setTmMsg({ type: 'error', text: err.response?.data?.message || 'Could not verify this classmate right now.' });
    } finally {
      setTmChecking(false);
    }
  };

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

    if (teamLimit > 0 && teamMembers.length !== teamLimit) {
      setMsg({ type: 'error', text: `Please add exactly ${teamLimit} teammates (${teamMembers.length}/${teamLimit} added) to register for this event.` });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });

      const formData = new FormData();
      if (paperFile) {
        formData.append('paperPdf', paperFile);
      }
      if (teamMembers.length) {
        formData.append('teamMembers', JSON.stringify(teamMembers.map((m) => ({ name: m.name, phone: m.phone }))));
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>

          {/* Event Schedule & Venue Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.date && (
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Event Date</span>
                  <span className="text-xs font-bold text-white">{formatDate(event.date)}</span>
                </div>
              </div>
            )}
            {event.time && (
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Event Time</span>
                  <span className="text-xs font-bold text-white">{event.time}</span>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Venue</span>
                  <span className="text-xs font-bold text-white">{event.venue}</span>
                </div>
              </div>
            )}
            </div>

          {/* Event Coordinators */}
          {(event.facultyCoordinator?.name || event.studentCoordinator?.name) && (
            <div className="p-3 bg-slate-900/70 rounded-xl border border-emerald-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Event Coordinators</span>
              </span>
              {event.facultyCoordinator?.name && (
                <p className="text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">Faculty:</span> {event.facultyCoordinator.name}
                  {event.facultyCoordinator.phone ? ` • ${event.facultyCoordinator.phone}` : ''}
                </p>
              )}
              {event.studentCoordinator?.name && (
                <p className="text-xs text-slate-300">
                  <span className="text-cyan-400 font-bold">Student:</span> {event.studentCoordinator.name}
                  {event.studentCoordinator.phone ? ` • ${event.studentCoordinator.phone}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Registration limit notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold">Registration Limit:</span> Each student can register for a maximum of 3 events only.
            </span>
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

          {/* Team Members */}
          {teamLimit > 0 && (
          <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 text-cyan-300">
                <UserPlus className="w-4 h-4" />
                <span>Add Team Members (Required — {teamMembers.length}/{teamLimit})</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Please add exactly {teamLimit} classmates who are already registered on DATAVERSE and registered
                for this event. Registration is blocked until the team is complete.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={tmName}
                onChange={(e) => setTmName(e.target.value)}
                placeholder="Classmate name"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={tmPhone}
                  onChange={(e) => setTmPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddTeammate}
                  disabled={tmChecking || teamMembers.length >= teamLimit}
                  className="shrink-0 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-60 flex items-center space-x-1"
                >
                  {tmChecking ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add</span>
                </button>
              </div>
            </div>

            {tmMsg.text && (
              <div className={`p-2.5 rounded-lg text-[10px] flex items-center space-x-1.5 ${
                tmMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {tmMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                <span>{tmMsg.text}</span>
              </div>
            )}

            {teamMembers.length > 0 && (
              <div className="space-y-1.5">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-400 mr-1 -mt-0.5" />
                        {member.name}
                        <span className="text-slate-400 font-normal"> • {member.phone}</span>
                      </p>
                      {member.collegeName && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {member.collegeName}
                          {member.department ? ` • ${member.department}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeTeammate(idx)}
                      className="shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove teammate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
