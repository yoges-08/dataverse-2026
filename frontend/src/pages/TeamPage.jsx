import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, UserPlus, UserMinus, AlertCircle, CheckCircle2, Copy, Link2,
  Trophy, ShieldCheck, Loader, ArrowLeft, Settings2, Crown
} from 'lucide-react';
import API from '../services/api';

export default function TeamPage() {
  const { editCode } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Add-member form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  // Team size editor
  const [sizeInput, setSizeInput] = useState('');
  const [savingSize, setSavingSize] = useState(false);

  // Copied link feedback
  const [copied, setCopied] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const res = await API.get(`/team/${editCode}`);
      if (res.data.success) {
        setTeam(res.data.team);
        setSizeInput(String(res.data.team.teamSize));
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [editCode]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400 flex items-center justify-center space-x-3">
        <Loader className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-sm">Loading your team...</span>
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <span className="text-6xl font-black text-indigo-500">404</span>
        <h1 className="text-2xl font-black text-white">Team Not Found</h1>
        <p className="text-sm text-slate-400">
          This team link is invalid or has been removed. Check the link sent to
          the team leader's email, or contact the symposium desk.
        </p>
        <Link to="/" className="inline-block mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30">
          Back to Home
        </Link>
      </div>
    );
  }

  const ev = team.event || {};
  const limit = ev.teamLimit || team.teamSize || 0;
  const isFull = team.memberCount >= team.teamSize;
  const isSolo = Number(limit) === 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (!name.trim() || !phone.trim()) {
      setMsg({ type: 'error', text: 'Enter your classmate\'s name and phone number.' });
      return;
    }
    if (isFull) {
      setMsg({ type: 'error', text: `Team is full (${team.teamSize} members).` });
      return;
    }
    try {
      setAdding(true);
      const res = await API.post(`/team/${editCode}/members`, { name: name.trim(), phone: phone.trim() });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setName('');
        setPhone('');
        setTeam(res.data.team);
        setSizeInput(String(res.data.team.teamSize));
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add teammate.' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (member) => {
    if (member.isLeader) return;
    if (!window.confirm(`Remove ${member.name} from this team?`)) return;
    setMsg({ type: '', text: '' });
    try {
      const res = await API.delete(`/team/${editCode}/members/${member._id}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setTeam(res.data.team);
        setSizeInput(String(res.data.team.teamSize));
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to remove teammate.' });
    }
  };

  const handleSize = async () => {
    setMsg({ type: '', text: '' });
    const value = Number(sizeInput);
    if (!Number.isFinite(value) || value < 1) {
      setMsg({ type: 'error', text: 'Enter a valid team size.' });
      return;
    }
    try {
      setSavingSize(true);
      const res = await API.put(`/team/${editCode}/team-size`, { teamSize: value });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setTeam(res.data.team);
        setSizeInput(String(res.data.team.teamSize));
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update team size.' });
    } finally {
      setSavingSize(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg({ type: 'error', text: 'Could not copy link automatically. Copy the browser URL manually.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Back link */}
      <Link to="/dashboard/student" className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">{ev.category || ''} Event</span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{ev.title || 'Symposium Event'}</h1>
              <p className="text-xs text-slate-300 mt-1 font-mono">{team.teamId}</p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Team Link'}</span>
          </button>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            team.status === 'Complete'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : team.status === 'Open'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}>
            {team.status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-700">
            {team.memberCount} / {team.teamSize} members
          </span>
          {isFull ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Team full — no more members can be added
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {team.teamSize - team.memberCount} slot(s) remaining
            </span>
          )}
        </div>
      </div>

      {/* Feedback message */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {isSolo && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This event is <span className="font-bold">solo-only</span> — teams are not allowed. Contact the symposium desk if you believe this is a mistake.
          </span>
        </div>
      )}

      {/* Team roster */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-5">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Team Roster</span>
        </h3>

        <div className="space-y-3">
          {team.members.map((member) => (
            <div key={member._id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  member.isLeader ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-indigo-600/20 border border-indigo-500/40'
                }`}>
                  {member.isLeader ? <Crown className="w-5 h-5 text-amber-400" /> : <UserPlus className="w-5 h-5 text-indigo-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{member.name || 'Unnamed'}</span>
                    {member.isLeader && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">Leader</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {member.registerNumber} {member.college ? `• ${member.college}` : ''}
                  </p>
                </div>
              </div>
              {!member.isLeader && (
                <button
                  onClick={() => handleRemove(member)}
                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                  title="Remove teammate"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add teammate */}
      {!isSolo && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <span>Add a Teammate</span>
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Enter your classmate's <span className="text-white font-bold">name</span> and{' '}
            <span className="text-white font-bold">phone number</span>. They must be a registered
            DATAVERSE student from the same college <span className="text-white font-bold">and</span> must
            have registered for this same event.
          </p>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Teammate's full name"
              className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              inputMode="tel"
              className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={adding || isFull}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {adding ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>{adding ? 'Adding...' : 'Add Teammate'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Team size editor */}
      {!isSolo && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Settings2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Declared Team Size</h4>
              <p className="text-[11px] text-slate-400">
                Maximum total members (leader included) allowed for {ev.title}: <span className="text-white font-bold">{limit}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={limit || undefined}
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              className="w-24 p-3 bg-slate-900 rounded-xl border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSize}
              disabled={savingSize || isFull}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center space-x-2"
            >
              {savingSize ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules note */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
        <span>
          Teammates are auto-validated: same college, registered for this event, not already on another team
          for this event. The team leader cannot be removed.
        </span>
      </div>

      {/* Prizes */}
      {ev.prizes && (ev.prizes.first || ev.prizes.second || ev.prizes.third) && (
        <div className="glass-card p-6 rounded-2xl border border-amber-500/30">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Prizes</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {ev.prizes.first && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-amber-400 font-black block mb-1">First Prize</span>
                <span className="text-slate-200">{ev.prizes.first}</span>
              </div>
            )}
            {ev.prizes.second && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-black block mb-1">Second Prize</span>
                <span className="text-slate-200">{ev.prizes.second}</span>
              </div>
            )}
            {ev.prizes.third && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <span className="text-orange-400 font-black block mb-1">Third Prize</span>
                <span className="text-slate-200">{ev.prizes.third}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Venue footer link */}
      <div className="text-center pt-2">
        <Link2 className="w-4 h-4 inline-block text-indigo-400 mr-1 align-[-3px]" />
        <Link to="/events" className="text-xs text-indigo-400 font-bold hover:underline">
          Browse more DATAVERSE 2026 events
        </Link>
      </div>

    </div>
  );
}
