import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, ShieldCheck, QrCode, User, Code, MapPin, Eye, Sparkles
} from 'lucide-react';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import { getStudentName } from '../../utils/studentName';
import API from '../../services/api';

export default function CoOrganizerDashboard() {
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [registrants, setRegistrants] = useState([]);
  const [events, setEvents] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  // Modals & State
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoOrganizerData();
  }, []);

  const loadCoOrganizerData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, registrantsRes, eventRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/registrants').catch(() => API.get('/admin/students')),
        API.get('/events')
      ]);

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.stats || {});
        setCharts(analyticsRes.data.charts || {});
      }

      // Handle either registrants list or students list
      if (registrantsRes.data.success) {
        if (registrantsRes.data.registrants) {
          setRegistrants(registrantsRes.data.registrants);
        } else if (registrantsRes.data.students) {
          // Flatten student-event rows if students array was returned
          const flattened = [];
          registrantsRes.data.students.forEach(s => {
            const name = getStudentName(s, s.email || 'Student');
            const regs = s.registeredEvents || [];
            if (regs.length > 0) {
              regs.forEach(r => {
                flattened.push({
                  _id: `${s._id}-${r.event?._id || r.event}`,
                  studentId: s._id,
                  symposiumCode: s.symposiumCode || '',
                  studentName: name,
                  email: s.email || '',
                  phone: s.phone || '',
                  collegeName: s.collegeName || '',
                  department: s.department || '',
                  year: s.year || '',
                  verificationStatus: s.verificationStatus || 'Pending',
                  registrationStatus: r.status || s.verificationStatus || 'Registered',
                  isCheckedIn: !!s.isCheckedIn,
                  event: r.event ? {
                    _id: r.event._id,
                    title: r.event.title,
                    category: r.event.category,
                    venue: r.event.venue,
                    date: r.event.date
                  } : null,
                  rawStudent: s
                });
              });
            } else {
              // Student with no events registered yet
              flattened.push({
                _id: s._id,
                studentId: s._id,
                symposiumCode: s.symposiumCode || '',
                studentName: name,
                email: s.email || '',
                phone: s.phone || '',
                collegeName: s.collegeName || '',
                department: s.department || '',
                year: s.year || '',
                verificationStatus: s.verificationStatus || 'Pending',
                registrationStatus: s.verificationStatus || 'Registered',
                isCheckedIn: !!s.isCheckedIn,
                event: null,
                rawStudent: s
              });
            }
          });
          setRegistrants(flattened);
        }
      }

      if (eventRes.data.success) {
        setEvents(eventRes.data.events || []);
      }
    } catch (err) {
      console.error('Co-Organizer load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRegistrants = registrants.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
      (r.symposiumCode && r.symposiumCode.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q)) ||
      (r.event && r.event.title && r.event.title.toLowerCase().includes(q));

    const matchesStatus = 
      !statusFilter || 
      r.verificationStatus === statusFilter || 
      r.registrationStatus === statusFilter;

    const matchesEvent = 
      !eventFilter || 
      (r.event && (String(r.event._id) === String(eventFilter) || r.event.title === eventFilter));

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
              View-Only Access
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-2">Symposium Overview & Event Registrations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Read-only access to view participant registrations per competition, college breakdowns, and live counts.
          </p>
        </div>

        <button
          onClick={loadCoOrganizerData}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Participants</span>
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

      {/* Per-Event Registration Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Per-Event Registration Summary</span>
          </h2>
          <span className="text-xs text-slate-400">{events.length} competitions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const teamStatsMap = {};
            (charts.eventWiseRegistrations || []).forEach(r => { if (r._id) teamStatsMap[String(r._id)] = r; });
            return events.map((ev) => {
              const t = teamStatsMap[String(ev._id)];
              return (
                <div key={ev._id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.category === 'Technical' 
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
                        : 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                    }`}>
                      {ev.category}
                    </span>
                    <span className="text-[10px] text-slate-500">Cap: {ev.maxParticipants || 100}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{ev.title}</h3>
                  <p className="text-xs text-slate-400">{ev.venue || 'TBA'} • {ev.date || '12/09/2026'}</p>

                  {t ? (
                    <div className="pt-1 text-xs text-slate-300 flex items-center space-x-2">
                      <span className="font-extrabold text-white">{t.total || 0} registered</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                        {t.teams || 0} team{(t.teams || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                        {t.solo || 0} solo
                      </span>
                    </div>
                  ) : (
                    <p className="pt-1 text-xs text-slate-400 font-bold">{ev.currentRegistrations || 0} registered</p>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Detailed Registrants Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Registered Students Per Event</span>
            </h2>
            <p className="text-xs text-slate-400">
              Showing {filteredRegistrants.length} total event registration records
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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

        {/* Student-Event Registrations Table (Read-Only) */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">College Name</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Event Registered</th>
                  <th className="p-4">Registration Status</th>
                  <th className="p-4 text-right">View Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRegistrants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No student registration records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrants.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Student Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block">{r.studentName}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{r.email || r.symposiumCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* College Name */}
                      <td className="p-4 font-medium text-slate-200 max-w-[200px] whitespace-normal break-words">
                        {r.collegeName || '—'}
                      </td>

                      {/* Department */}
                      <td className="p-4 text-slate-300">
                        {r.department || '—'}
                      </td>

                      {/* Year */}
                      <td className="p-4 text-slate-300 font-semibold">
                        {r.year ? `Year ${r.year}` : '—'}
                      </td>

                      {/* Event Registered */}
                      <td className="p-4">
                        {r.event ? (
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.event.category === 'Technical'
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-pink-600/20 text-pink-300 border border-pink-500/30'
                            }`}>
                              {r.event.title}
                            </span>
                            {r.language && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-cyan-300">
                                {r.language}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No event assigned</span>
                        )}
                      </td>

                      {/* Registration Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          (r.verificationStatus === 'Approved' || r.registrationStatus === 'Approved')
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          (r.verificationStatus === 'Rejected' || r.registrationStatus === 'Rejected')
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {r.verificationStatus || r.registrationStatus || 'Pending'}
                        </span>
                      </td>

                      {/* Read-Only Badge Preview */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForBadge(r.rawStudent || {
                            _id: r.studentId,
                            symposiumCode: r.symposiumCode,
                            collegeName: r.collegeName,
                            department: r.department,
                            year: r.year,
                            email: r.email,
                            phone: r.phone,
                            verificationStatus: r.verificationStatus,
                            isCheckedIn: r.isCheckedIn,
                            user: { name: r.studentName, email: r.email }
                          })}
                          className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                          title="View Badge & QR Pass"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
