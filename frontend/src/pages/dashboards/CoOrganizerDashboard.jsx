import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, ShieldCheck, QrCode, UserCheck, User, Code, MapPin, Eye, Sparkles, Loader
} from 'lucide-react';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import { getStudentName } from '../../utils/studentName';
import API from '../../services/api';

export default function CoOrganizerDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Event Detail State
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoOrganizerData();
  }, []);

  const loadCoOrganizerData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentRes, eventRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/students'),
        API.get('/events')
      ]);

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.stats || {});
        setCharts(analyticsRes.data.charts || {});
      }
      if (studentRes.data.success) setStudents(studentRes.data.students || []);
      if (eventRes.data.success) setEvents(eventRes.data.events || []);
    } catch (err) {
      console.error('Co-Organizer load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEventRegistrations = async (ev) => {
    try {
      setDetailLoading(true);
      setDetailError('');
      const res = await API.get(`/events/${ev._id}`);
      if (res.data.success) {
        setEventDetail(res.data);
        setShowEventDetail(true);
      } else {
        setDetailError(res.data.message || 'Could not load registration details.');
        setShowEventDetail(true);
      }
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Could not load event registrations.');
      setShowEventDetail(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const name = getStudentName(s, s.email || 'Student').toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (s.symposiumCode && s.symposiumCode.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      name.includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q));

    const matchesStatus = !statusFilter || s.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading Co-Organizer Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
              DATAVERSE Co-Organizer Console
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[10px] border border-slate-700">
              View-Only
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-2">Management & Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Read-only overview of student registrations and competition event participation.</p>
        </div>

        <button
          onClick={loadCoOrganizerData}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Registered</span>
          <span className="text-3xl font-black text-white">{stats.totalStudents || 0}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30">
          <span className="text-[10px] text-amber-400 font-bold uppercase block">Pending Approvals</span>
          <span className="text-3xl font-black text-amber-400">{stats.pendingStudents || 0}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30">
          <span className="text-[10px] text-emerald-400 font-bold uppercase block">Approved Students</span>
          <span className="text-3xl font-black text-emerald-400">{stats.approvedStudents || 0}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-indigo-500/30">
          <span className="text-[10px] text-indigo-400 font-bold uppercase block">Venue Checked-In</span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-400">
            {stats.checkedInCount || 0} ({stats.attendancePercentage || 0}%)
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'students', label: `Students (${students.length})` },
          { id: 'events', label: `Symposium Events (${events.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: STUDENTS MANAGEMENT (READ-ONLY) */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Code (DV2026-REG-1001), College, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Symposium Code</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">College & Dept</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Checked In</th>
                    <th className="p-4 text-right">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No student records match the search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const name = getStudentName(s, s.email || 'Student');
                      return (
                        <tr key={s._id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-white block">{name}</span>
                                <span className="text-[10px] text-slate-400 truncate block">{s.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-indigo-400">{s.symposiumCode}</td>
                          <td className="p-4 text-slate-300 whitespace-nowrap">{s.phone || '—'}</td>
                          <td className="p-4">
                            <span className="text-slate-200 block font-medium max-w-[220px] whitespace-normal break-words">{s.collegeName}</span>
                            <span className="text-[10px] text-indigo-300">{s.department} ({s.year})</span>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              s.verificationStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              s.verificationStatus === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {s.verificationStatus}
                            </span>
                          </td>

                          <td className="p-4">
                            {s.isCheckedIn ? (
                              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Checked In</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">Not Checked In</span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedStudentForBadge(s)}
                              className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                              title="Preview Badge & QR Pass"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYMPOSIUM EVENTS (WITH REGISTRANTS BUTTON) */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-bold text-white">Symposium Competitions</h3>
            <span className="text-xs text-slate-400">{events.length} competitions available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const teamStatsMap = {};
              (charts.eventWiseRegistrations || []).forEach(r => { if (r._id) teamStatsMap[String(r._id)] = r; });
              return events.map((ev) => {
                const t = teamStatsMap[String(ev._id)];
                return (
                  <div key={ev._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">{ev.category}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{ev.title}</h4>
                    <p className="text-xs text-slate-400">{ev.venue} • {ev.date}</p>
                    {t ? (
                      <p className="text-[11px] text-slate-300 flex items-center space-x-2">
                        <span className="font-bold text-white">{t.total || 0} registered</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                          {t.teams || 0} team{(t.teams || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                          {t.solo || 0} solo
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">{ev.currentRegistrations || 0} registered</p>
                    )}
                    {ev.studentCoordinator?.name && (
                      <p className="text-xs text-emerald-400 font-medium">Coordinator: {ev.studentCoordinator.name}</p>
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => handleViewEventRegistrations(ev)}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs border border-emerald-500/30 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Registrants</span>
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Student Badge & QR Modal */}
      {selectedStudentForBadge && (
        <StudentBadgeModal
          student={selectedStudentForBadge}
          onClose={() => setSelectedStudentForBadge(null)}
        />
      )}

      {/* Event Registrants Modal */}
      {showEventDetail && (eventDetail || detailError) && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{eventDetail?.event?.title || 'Registrants'}</h3>
                <span className="text-[10px] uppercase font-bold text-indigo-400">
                  {eventDetail?.event?.category || ''}{eventDetail?.event?.venue ? ` • ${eventDetail.event.venue}` : ''}
                </span>
              </div>
              <button 
                onClick={() => setShowEventDetail(false)} 
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading registrations...</span>
              </div>
            ) : detailError ? (
              <div className="p-6 text-center text-xs text-red-400 bg-red-500/10 rounded-xl border border-red-500/30 space-y-2">
                <p className="font-bold">Could not open registrations</p>
                <p>{detailError}</p>
              </div>
            ) : ((eventDetail.groups || eventDetail.registrations).length) === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                No students have registered for this event yet.
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const grouped = eventDetail.groups || eventDetail.registrations;
                  const studentCount = grouped.reduce((n, g) => n + (g.kind === 'team' ? (g.registrations?.length || 1) : 1), 0);
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">{studentCount} student(s) registered</p>
                      </div>

                      {/* Per-Language Breakdown Summary */}
                      {eventDetail?.event?.requiresLanguageChoice && eventDetail?.languageBreakdown && (
                        <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                            <Code className="w-4 h-4 text-indigo-400" />
                            <span>Language Breakdown:</span>
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {Object.entries(eventDetail.languageBreakdown).map(([lang, count]) => (
                              <span key={lang} className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-mono font-bold text-xs">
                                {lang}: <span className="text-white font-extrabold">{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {grouped.map((g, idx) => {
                        if (g.kind === 'team') {
                          const team = g.team;
                          return (
                            <div key={g._id || idx} className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800/60">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wide font-bold text-cyan-400">
                                    Team ({team.memberCount} member{team.memberCount > 1 ? 's' : ''})
                                  </p>
                                  <span className="text-[10px] text-cyan-300/60 font-mono">{team.teamId}</span>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold text-cyan-300">{g.registrations?.length || 0} registered</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {team.members.map((tm, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-200">
                                    {tm.name}
                                    {tm.year && <span className="text-cyan-300/70">{tm.department ? `${tm.department} • Yr ${tm.year}` : `Yr ${tm.year}`}</span>}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-cyan-800/50 space-y-1">
                                {(g.registrations || []).map((r, rIdx) => (
                                  <div key={r._id || rIdx} className="flex items-center justify-between gap-3 text-[10px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-bold text-white truncate">{getStudentName(r.student, 'Unknown')}</span>
                                      {r.language && (
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-mono font-bold text-[9px] shrink-0">
                                          {r.language}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-indigo-300 shrink-0">{r.student?.symposiumCode || r.student?.registerNumber}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        const s = g.student;
                        const lang = g.language || (eventDetail.registrations?.find(r => (r._id === g._id || (r.student && String(r.student._id || r.student) === String(s?._id || s))))?.language);
                        return (
                          <div key={g._id || idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm block">{getStudentName(s, 'Unknown')}</span>
                                  {lang && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold text-[10px]">
                                      {lang}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block">{s?.email} • {s?.collegeName}</span>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold text-indigo-300 font-mono">{s?.symposiumCode || s?.registerNumber}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500">No teammates added</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Solo</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
