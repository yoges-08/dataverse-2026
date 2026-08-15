import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, UserMinus, AlertCircle, CheckCircle2, Loader,
  ShieldCheck, ArrowLeft, Group, RefreshCw
} from 'lucide-react';
import API from '../../services/api';

export default function TeamManagementTab() {
  const [myEvents, setMyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Team detail state
  const [team, setTeam] = useState(null);
  const [available, setAvailable] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Mutations
  const [adding, setAdding] = useState(null);
  const [removing, setRemoving] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await API.get('/teams/my-events');
      if (res.data.success) setMyEvents(res.data.events || []);
    } catch (err) {
      console.error('Error loading team events:', err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not load your team events.' });
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadDetail = useCallback(async (eventId) => {
    try {
      setDetailLoading(true);
      setMsg({ type: '', text: '' });
      const [teamRes, availRes] = await Promise.all([
        API.get(`/teams/event/${eventId}`),
        API.get(`/teams/event/${eventId}/available`)
      ]);
      if (teamRes.data.success) {
        setTeam(teamRes.data.team);
      } else {
        setMsg({ type: 'error', text: teamRes.data.message });
      }
      if (availRes.data.success) setAvailable(availRes.data.students || []);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not load team details.' });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    loadDetail(ev._id || ev.id);
  };

  const backToList = () => {
    setSelectedEvent(null);
    setTeam(null);
    setAvailable([]);
    setMsg({ type: '', text: '' });
  };

  const handleAdd = async (student) => {
    setMsg({ type: '', text: '' });
    if (!selectedEvent) return;
    try {
      setAdding(student.studentId);
      const res = await API.post(`/teams/event/${selectedEvent._id || selectedEvent.id}/members`, {
        studentId: student.studentId
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setTeam(res.data.team);
        loadDetail(selectedEvent._id || selectedEvent.id);
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add teammate.' });
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (member) => {
    setMsg({ type: '', text: '' });
    if (!selectedEvent) return;
    if (!window.confirm(`Remove ${member.name || 'this member'} from the team?`)) return;
    try {
      setRemoving(member.studentId);
      const res = await API.delete(`/teams/event/${selectedEvent._id || selectedEvent.id}/members/${member.studentId}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setTeam(res.data.team);
        loadDetail(selectedEvent._id || selectedEvent.id);
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to remove member.' });
    } finally {
      setRemoving(null);
    }
  };

  if (loadingEvents) {
    return (
      <div className="glass-card p-10 rounded-2xl text-center text-slate-400 flex items-center justify-center space-x-3">
        <Loader className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-sm font-semibold">Loading your team events...</span>
      </div>
    );
  }

  // ---- Event list view ----
  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Group className="w-5 h-5 text-indigo-400" />
            <span>Team Management</span>
          </h3>
          <button
            onClick={loadEvents}
            className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Below are the events you're registered for that support team participation.
          Choose an event to build or manage your team with classmates from the same college.
        </p>

        {myEvents.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-slate-800 text-center space-y-3">
            <Users className="w-10 h-10 text-indigo-400 mx-auto opacity-50" />
            <p className="text-sm text-slate-300 font-bold">No team-enabled events yet</p>
            <p className="text-xs text-slate-400">
              Register for a team event (like Agentic AI or NovaSpeak) to start forming your team here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myEvents.map((ev) => (
              <button
                key={ev._id || ev.id}
                onClick={() => selectEvent(ev)}
                className="glass-card p-5 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 transition-all text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">{ev.category}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    (ev.teamLimit > 4) ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    Up to {ev.teamLimit} members
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-1">{ev.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {ev.date ? new Date(ev.date).toLocaleDateString() : ''} {ev.venue ? `• ${ev.venue}` : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Team detail view ----
  const ev = team?.event || selectedEvent || {};
  const isFull = team && team.memberCount >= team.teamSize;

  return (
    <div className="space-y-6">
      <button
        onClick={backToList}
        className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to my team events</span>
      </button>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-indigo-500/30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">{ev.category || ''}</span>
              <h3 className="text-xl font-black text-white">{ev.title || 'Symposium Event'}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{team?.teamId || ''}</p>
            </div>
          </div>
        </div>

        {/* Status chips */}
        {team && (
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
                Team full
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {team.teamSize - team.memberCount} slot(s) open
              </span>
            )}
          </div>
        )}
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

      {detailLoading ? (
        <div className="glass-card p-10 rounded-2xl text-center text-slate-400 flex items-center justify-center space-x-3">
          <Loader className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-sm font-semibold">Loading team...</span>
        </div>
      ) : team ? (
        <>
          {/* Team roster */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-5">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Team Roster</span>
            </h3>

            {team.members.length === 0 ? (
              <p className="text-xs text-slate-400">No members yet.</p>
            ) : (
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div key={member._id || member.studentId} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{member.name || 'Unnamed'}</p>
                        <p className="text-[11px] text-slate-400">
                          {member.department || '—'}{member.year ? ` • Year ${member.year}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={removing === member.studentId || team.memberCount <= 1}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      title={team.memberCount <= 1 ? 'A team must always have at least one member' : 'Remove member'}
                    >
                      {removing === member.studentId ? <Loader className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add a teammate */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <span>Add a Teammate</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              These are students registered for this event from your college, department and year who are not yet
              on a team. Click one to add them instantly.
            </p>

            {isFull ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                This team is full — no more members can be added.
              </div>
            ) : available.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                No classmates available to add right now. Eligible students must be registered for this event,
                from your college/department/year, and not already on another team.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {available.map((st) => (
                  <div key={st.studentId} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{st.name || 'Unnamed Student'}</p>
                      <p className="text-[11px] text-slate-400">
                        {st.department || '—'}{st.year ? ` • Year ${st.year}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(st)}
                      disabled={adding === st.studentId}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
                    >
                      {adding === st.studentId ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rules note */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Only students registered for this event from the same college, department and year can be added.
              Any member can add or remove any teammate — everyone has the same access. This event allows up to
              <span className="text-white font-bold"> {ev.teamLimit || team.teamSize} </span> members. A team always keeps at least one member.
            </span>
          </div>
        </>
      ) : (
        <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-400">
          Could not load your team for this event.
        </div>
      )}
    </div>
  );
}