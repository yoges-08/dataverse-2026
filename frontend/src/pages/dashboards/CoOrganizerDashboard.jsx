import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, ShieldCheck, QrCode, User, Code, MapPin, Eye
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
  const [eventFilter, setEventFilter] = useState('');

  // Modals
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState(null);
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

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const name = getStudentName(s, s.email || '').toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (s.symposiumCode && s.symposiumCode.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      name.includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q));

    const matchesStatus = !statusFilter || s.verificationStatus === statusFilter;
    const matchesEvent = !eventFilter || (s.registeredEvents && s.registeredEvents.some(e => (e.event?._id || e.event) === eventFilter));

    return matchesSearch && matchesStatus && matchesEvent;
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
          <h1 className="text-3xl font-black text-white mt-2">Symposium Overview & Registrations</h1>
          <p className="text-xs text-slate-400 mt-1">Read-only view of symposium participant registrations and competition metrics.</p>
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
          { id: 'students', label: `Registrants (${students.length})` },
          { id: 'events', label: `Event Participation (${events.length})` }
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

      {/* TAB 1: REGISTRANTS TABLE (READ-ONLY) */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Code, Name, College, Email..."
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

              {events.length > 0 && (
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                >
                  <option value="">All Events</option>
                  {events.map(ev => (
                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Students Table (Read-Only) */}
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
                    <th className="p-4 text-right">View Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No registrant records match the current filters.
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
                              title="View Badge & QR Pass"
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

      {/* TAB 2: EVENT PARTICIPATION (READ-ONLY) */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Event Registration Counts</h3>
            <span className="text-xs text-slate-400">{events.length} competitions</span>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.category === 'Technical' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                      }`}>
                        {ev.category}
                      </span>
                      <span className="text-[10px] text-slate-500">Cap: {ev.maxParticipants || 100}</span>
                    </div>

                    <h4 className="text-lg font-bold text-white">{ev.title}</h4>
                    <p className="text-xs text-slate-400">{ev.venue} • {ev.date}</p>

                    {t ? (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-300 flex items-center space-x-2">
                          <span className="font-extrabold text-white text-sm">{t.total || 0} registered</span>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                            {t.teams || 0} team{(t.teams || 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                            {t.solo || 0} solo
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold">{ev.currentRegistrations || 0} registered</p>
                    )}

                    {ev.studentCoordinator?.name && (
                      <p className="text-xs text-emerald-400 font-medium">
                        Student Coord: {ev.studentCoordinator.name}
                      </p>
                    )}
                    {ev.facultyCoordinator?.name && (
                      <p className="text-xs text-slate-400">
                        Faculty: {ev.facultyCoordinator.name}
                      </p>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* View-Only Badge Modal */}
      {selectedStudentForBadge && (
        <StudentBadgeModal
          student={selectedStudentForBadge}
          onClose={() => setSelectedStudentForBadge(null)}
        />
      )}

    </div>
  );
}
