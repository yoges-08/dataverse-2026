import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, Plus, Trash2, Edit, ShieldCheck, QrCode, Download, Bell, Sparkles, UserCheck, User 
} from 'lucide-react';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import QRScannerModal from '../../components/QRScannerModal';
import API from '../../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [eventDetail, setEventDetail] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
  });

  // Edit Event Form State
  const [editEvent, setEditEvent] = useState({
    id: '', title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
  });

  const openEditEvent = (ev) => {
    setEditEvent({
      id: ev._id,
      title: ev.title || '',
      category: ev.category || 'Technical',
      tagline: ev.tagline || '',
      description: ev.description || '',
      rules: (ev.rules || []).join('\n'),
      venue: ev.venue || '',
      date: ev.date || '2026-09-12',
      time: ev.time || '',
      registrationDeadline: ev.registrationDeadline || '2026-09-11',
      maxParticipants: ev.maxParticipants || 100,
      facultyName: ev.facultyCoordinator?.name || '',
      facultyPhone: ev.facultyCoordinator?.phone || '',
      studentName: ev.studentCoordinator?.name || '',
      studentPhone: ev.studentCoordinator?.phone || '',
      firstPrize: ev.prizes?.first || '',
      secondPrize: ev.prizes?.second || '',
      thirdPrize: ev.prizes?.third || ''
    });
    setShowEditEventModal(true);
  };

  // New Staff Form State
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'coordinator' });

  // New Announcement Form State
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General', priority: 'Normal' });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentRes, eventRes, staffRes, annRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/students'),
        API.get('/events'),
        API.get('/admin/staff'),
        API.get('/announcements')
      ]);

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.stats);
        setCharts(analyticsRes.data.charts);
      }
      if (studentRes.data.success) setStudents(studentRes.data.students);
      if (eventRes.data.success) setEvents(eventRes.data.events);
      if (staffRes.data.success) setStaffList(staffRes.data.staff);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const res = await API.put(`/admin/students/${studentId}/status`, { status: newStatus });
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      const res = await API.delete(`/admin/students/${studentId}`);
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/events', {
        ...newEvent,
        rules: (newEvent.rules || '').split('\n'),
        facultyCoordinator: { name: newEvent.facultyName, phone: newEvent.facultyPhone },
        studentCoordinator: { name: newEvent.studentName, phone: newEvent.studentPhone },
        prizes: { first: newEvent.firstPrize, second: newEvent.secondPrize, third: newEvent.thirdPrize }
      });
      if (res.data.success) {
        setShowEventModal(false);
        loadAdminData();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/staff', newStaff);
      if (res.data.success) {
        setShowStaffModal(false);
        setNewStaff({ name: '', email: '', password: '', role: 'coordinator' });
        loadAdminData();
      }
    } catch (err) {
      console.error('Error creating staff:', err);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/announcements', newAnn);
      if (res.data.success) {
        setShowAnnModal(false);
        setNewAnn({ title: '', content: '', category: 'General', priority: 'Normal' });
        loadAdminData();
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await API.delete(`/announcements/${annId}`);
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove all its registrations too.`)) return;
    try {
      const res = await API.delete(`/events/${eventId}`);
      if (res.data.success) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/events/${editEvent.id}`, {
        title: editEvent.title,
        category: editEvent.category,
        tagline: editEvent.tagline,
        description: editEvent.description,
        rules: (editEvent.rules || '').split('\n').filter(r => r.trim()),
        venue: editEvent.venue,
        date: editEvent.date,
        time: editEvent.time || '',
        registrationDeadline: editEvent.registrationDeadline,
        maxParticipants: Number(editEvent.maxParticipants) || 100,
        facultyCoordinator: { name: editEvent.facultyName, phone: editEvent.facultyPhone },
        studentCoordinator: { name: editEvent.studentName, phone: editEvent.studentPhone },
        prizes: { first: editEvent.firstPrize, second: editEvent.secondPrize, third: editEvent.thirdPrize }
      });
      if (res.data.success) {
        setShowEditEventModal(false);
        loadAdminData();
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleViewEventRegistrations = async (ev) => {
    try {
      setDetailLoading(true);
      const res = await API.get(`/events/${ev._id}`);
      if (res.data.success) {
        setEventDetail(res.data);
        setShowEventDetail(true);
      }
    } catch (err) {
      console.error('Error fetching event registrations:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Symposium Code,Name,Email,Phone,DOB,College,Department,Year,Status,Checked In\n'];
    const rows = students.map(s => {
      const uName = s.user?.name || s.name || s.email;
      return `"${s.symposiumCode}","${uName}","${s.email}","${s.phone || ''}","${s.dateOfBirth || ''}","${s.collegeName}","${s.department}","${s.year}","${s.verificationStatus}","${s.isCheckedIn ? 'Yes' : 'No'}"\n`;
    });

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `DATAVERSE_Student_Registrations_${Date.now()}.csv`);
    a.click();
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.symposiumCode && s.symposiumCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.collegeName && s.collegeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.user && s.user.name && s.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || s.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Admin Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
            DATAVERSE Super Admin Console
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Management & Analytics Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Open QR Check-In Terminal</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <span className="text-3xl font-black text-indigo-400">{stats.checkedInCount || 0} ({stats.attendancePercentage || 0}%)</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'students', label: `Students (${students.length})` },
          { id: 'events', label: `Symposium Events (${events.length})` },
          { id: 'staff', label: `Coordinators & Volunteers (${staffList.length})` },
          { id: 'announcements', label: `Announcements (${announcements.length})` }
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

      {/* TAB 1: STUDENTS MANAGEMENT */}
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

            <div className="flex items-center space-x-2 w-full md:w-auto">
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
                    <th className="p-4">DOB</th>
                    <th className="p-4">College & Dept</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Checked In</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((s) => {
                    const name = s.user?.name || s.name || s.email;
                    return (
                      <tr key={s._id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{name}</span>
                            <span className="text-[10px] text-slate-400">{s.email}</span>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-bold text-indigo-400">{s.symposiumCode}</td>
                        <td className="p-4 text-slate-300 whitespace-nowrap">{s.phone || '—'}</td>
                        <td className="p-4 text-slate-300 whitespace-nowrap">{s.dateOfBirth || '—'}</td>
                        <td className="p-4">
                          <span className="text-slate-200 block font-medium max-w-[220px] truncate">{s.collegeName}</span>
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

                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedStudentForBadge(s)}
                            className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                            title="Preview Badge & QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {s.verificationStatus !== 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(s._id, 'Approved')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Approve
                            </button>
                          )}

                          {s.verificationStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleStatusChange(s._id, 'Rejected')}
                              className="px-2 py-1 rounded-lg bg-amber-600/30 text-amber-300 font-bold text-[10px]"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteStudent(s._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Manage Symposium Competitions</h3>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div key={ev._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">{ev.category}</span>
                </div>
                <h4 className="text-lg font-bold text-white">{ev.title}</h4>
                <p className="text-xs text-slate-400">{ev.venue} • {ev.date}</p>
                {ev.studentCoordinator?.name && (
                  <p className="text-xs text-emerald-400 font-medium">Coordinator: {ev.studentCoordinator.name}</p>
                )}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => openEditEvent(ev)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs border border-indigo-500/30 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleViewEventRegistrations(ev)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs border border-emerald-500/30 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Registrants</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev._id, ev.title)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs border border-red-500/30 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Event Coordinators & Volunteers</h3>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div key={st._id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{st.name}</h4>
                  <span className="text-xs text-slate-400 block">{st.email}</span>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 mt-1 block">{st.role.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Publish Live Announcements</h3>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Announcement</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann._id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">{ann.category}</span>
                  <h4 className="text-base font-bold text-white">{ann.title}</h4>
                  <p className="text-xs text-slate-300">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann._id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedStudentForBadge && (
        <StudentBadgeModal
          student={selectedStudentForBadge}
          onClose={() => setSelectedStudentForBadge(null)}
        />
      )}

      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onVerifySuccess={() => loadAdminData()}
        />
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-xl w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create New Symposium Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <input type="text" placeholder="Event Title (e.g. AI Hackathon)" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white">
                <option value="Technical">Technical</option>
                <option value="Non-Technical">Non-Technical</option>
              </select>
              <textarea placeholder="Description" required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="text" placeholder="Venue (e.g. CS Lab 1)" required value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4">
            <h3 className="text-lg font-bold text-white">Create Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <input type="text" placeholder="Full Name" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="email" placeholder="Email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="password" placeholder="Password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white">
                <option value="coordinator">Event Coordinator</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowStaffModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4">
            <h3 className="text-lg font-bold text-white">Publish Live Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <input type="text" placeholder="Title" required value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea placeholder="Announcement Content" required value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAnnModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-xl w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Edit Event</h3>
            <form onSubmit={handleUpdateEvent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Event Title" required value={editEvent.title} onChange={e => setEditEvent({...editEvent, title: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <select value={editEvent.category} onChange={e => setEditEvent({...editEvent, category: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white">
                  <option value="Technical">Technical</option>
                  <option value="Non-Technical">Non-Technical</option>
                </select>
              </div>
              <input type="text" placeholder="Tagline" value={editEvent.tagline} onChange={e => setEditEvent({...editEvent, tagline: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea placeholder="About / Description" required rows={3} value={editEvent.description} onChange={e => setEditEvent({...editEvent, description: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea
                placeholder="Rules & Guidelines (one per line)"
                required
                rows={5}
                value={editEvent.rules}
                onChange={e => setEditEvent({...editEvent, rules: e.target.value})}
                className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Venue" required value={editEvent.venue} onChange={e => setEditEvent({...editEvent, venue: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <input type="date" required value={editEvent.date} onChange={e => setEditEvent({...editEvent, date: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              </div>
              <input type="text" placeholder="Student Coordinator Name (optional)" value={editEvent.studentName} onChange={e => setEditEvent({...editEvent, studentName: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="text" placeholder="Faculty Coordinator Name (optional)" value={editEvent.facultyName} onChange={e => setEditEvent({...editEvent, facultyName: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditEventModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Update Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Registrants Modal */}
      {showEventDetail && eventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{eventDetail.event.title}</h3>
                <span className="text-[10px] uppercase font-bold text-indigo-400">{eventDetail.event.category} • {eventDetail.event.venue}</span>
              </div>
              <button onClick={() => setShowEventDetail(false)} className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white">✕</button>
            </div>

            {detailLoading ? (
              <p className="text-xs text-slate-400">Loading registrations...</p>
            ) : eventDetail.registrations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                No students have registered for this event yet.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-white">{eventDetail.registrations.length} student(s) registered</p>
                {eventDetail.registrations.map((reg, idx) => {
                  const s = reg.student;
                  return (
                    <div key={reg._id || idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm block">{s?.user?.name || s?.name || s?.email || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 block">{s?.email} • {s?.collegeName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-300 font-mono">{s?.symposiumCode || s?.registerNumber}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
