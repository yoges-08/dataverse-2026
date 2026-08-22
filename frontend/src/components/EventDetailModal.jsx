import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { X, AlertCircle, FileText, Sparkles, Calendar, Clock, MapPin, User, Code, Check } from 'lucide-react';
import API from '../services/api';

const formatDate = (d) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

export default function EventDetailModal({ event, onClose, onRegisterSuccess }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [paperFile, setPaperFile] = useState(null);
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!event) return null;

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/events', reason: 'register' } });
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

    if (event.requiresLanguageChoice && !language) {
      setMsg({ type: 'error', text: 'Please select a programming language to register for this event.' });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });

      const formData = new FormData();
      if (paperFile) {
        formData.append('paperPdf', paperFile);
      }
      if (event.requiresLanguageChoice && language) {
        formData.append('language', language);
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

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Sticky close — pinned near the top of the viewport while the card
            scrolls, so it never disappears when you scroll down to Register. */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="block ml-auto mr-2 sm:mr-3 sticky top-1 z-30 -mb-11 min-w-[44px] min-h-[44px] p-2.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="glass-card modal-card w-full rounded-t-2xl sm:rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl relative flex flex-col">
        
        {/* Banner Header */}
        <div className="relative h-40 sm:h-48 bg-slate-900 shrink-0">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                event.category === 'Technical'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
              }`}>
                {event.category} Event
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-1 leading-tight">{event.title}</h2>
            </div>
          </div>
        </div>

        {/* Content (no internal scroll — grows naturally, page scrolls if needed) */}
        <div className="p-4 sm:p-6 pt-5 space-y-5">
          
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

          {/* NovaSpeak paper submission notice */}
          {event.title === 'NovaSpeak' && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
              <FileText className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-bold">Paper Submission:</span> After registering, send your paper presentation to{' '}
                <a href="mailto:novaspeak.aamec26@gmail.com" className="font-bold underline hover:text-rose-200">novaspeak.aamec26@gmail.com</a>
              </span>
            </div>
          )}

          {/* Viral Vision reel submission notice */}
          {event.title === 'Viral Vision' && (
            <>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold">Reel Submission:</span> After registering, send your reels to this number{' '}
                  <a href="tel:7845204654" className="font-bold underline hover:text-rose-200">7845204654</a>{' '}
                  or{' '}
                  <a href="https://wa.me/qr/R7CRFQEORARMK1" target="_blank" rel="noreferrer" className="font-bold underline hover:text-rose-200">WhatsApp</a>
                </span>
              </div>

              {/* Viral Vision topics */}
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs text-pink-200">
                <span className="font-bold text-pink-300 flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Reel Topics</span>
                </span>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Engineering Student Life</li>
                  <li>Our Last College Bell</li>
                  <li>A World Without Phones</li>
                  <li>The Unseen Side of Success</li>
                  <li>The Lesson Beyond the Textbooks</li>
                  <li>Degree vs. Skills</li>
                  <li>The Last Bench vs. The First Bench</li>
                </ul>
              </div>
            </>
          )}

          {/* Team Management notice */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold">Team Management:</span> After registering, you can join or create a team for this event with registered classmates from your college in the{' '}
              <Link to="/team-management" className="font-bold underline hover:text-indigo-200">Team Management</Link> tab.
            </span>
          </div>

        </div>

        {/* Programming Language Selection (for Bug Hunt / language-enabled events) */}
        {event.requiresLanguageChoice && (
          <div className="px-4 sm:px-6 pb-3 pt-1 shrink-0">
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span>Choose Programming Language <span className="text-rose-400">*</span></span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Select the programming language you will use to identify and debug code during the competition.
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {['Python', 'C', 'C++'].map((langOption) => (
                  <button
                    key={langOption}
                    type="button"
                    onClick={() => {
                      setLanguage(langOption);
                      if (msg.type === 'error') setMsg({ type: '', text: '' });
                    }}
                    className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border flex flex-col items-center justify-center space-y-1 ${
                      language === langOption
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{langOption}</span>
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${
                      language === langOption ? 'text-indigo-200' : 'text-slate-500'
                    }`}>
                      {language === langOption ? '✓ Selected' : 'Choose'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PDF Upload for Paper Presentation (always reachable above the button) */}
        {event.pdfRequired && (
          <div className="px-4 sm:px-6 pb-3 pt-1 shrink-0">
            <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-2">
              <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Upload Paper Presentation Abstract (.pdf mandatory)</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPaperFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Sticky Register footer — always visible */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur shrink-0 space-y-3">
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-[opacity,transform] duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing Registration...' : 'Register For Event'}</span>
          </button>
        </div>

      </div>
      </div>
    </div>,
    document.body
  );
}
