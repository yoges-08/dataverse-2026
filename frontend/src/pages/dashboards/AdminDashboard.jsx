import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, Plus, Trash2, Edit, ShieldCheck, QrCode, Download, Bell, Sparkles, UserCheck, User,
  FileBadge, Loader, Upload, X
} from 'lucide-react';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import QRScannerModal from '../../components/QRScannerModal';
import { getStudentName } from '../../utils/studentName';
import API from '../../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Contact form messages (inbox)
  const [contactMessages, setContactMessages] = useState([]);
  const [messagesBusy, setMessagesBusy] = useState(false);

  // Certificate generation state
  const [certStudentId, setCertStudentId] = useState('');
  const [certEventId, setCertEventId] = useState('');
  const [certType, setCertType] = useState('Participation');
  const [certBusy, setCertBusy] = useState(false);
  const [certMsg, setCertMsg] = useState(null);
  const [certSearch, setCertSearch] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [certDeleting, setCertDeleting] = useState(null);

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
    title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, teamLimit: 0, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
  });

  // Edit Event Form State
  const [editEvent, setEditEvent] = useState({
    id: '', title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, teamLimit: 0, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
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
      teamLimit: ev.teamLimit ?? 0,
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

  // Excel bulk import of students
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // New Announcement Form State
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General', priority: 'Normal' });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentRes, eventRes, staffRes, annRes, certRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/students'),
        API.get('/events'),
        API.get('/admin/staff'),
        API.get('/announcements'),
        API.get('/certificates/all')
      ]);

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.stats);
        setCharts(analyticsRes.data.charts);
      }
      if (studentRes.data.success) setStudents(studentRes.data.students);
      if (eventRes.data.success) setEvents(eventRes.data.events);
      if (staffRes.data.success) setStaffList(staffRes.data.staff);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);
      if (certRes.data.success) setCertificates(certRes.data.certificates);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
    loadContactMessages();
  };

const loadContactMessages = async () => {
    try {
      setMessagesBusy(true);
      const res = await API.get('/contact/messages');
      if (res.data.success) setContactMessages(res.data.messages);
    } catch (err) {
      console.error('Error loading contact messages:', err);
    } finally {
      setMessagesBusy(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await API.get('/admin/students/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DATAVERSE_Student_Import_Template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setImportMsg({ type: 'error', text: 'Could not download the template.' });
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setImportMsg({ type: 'error', text: 'Please upload an Excel (.xlsx / .xls) or CSV file.' });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    setImportMsg(null);
    setImportResult(null);
    try {
      const res = await API.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setImportMsg({ type: 'success', text: res.data.message });
        setImportResult(res.data);
        loadAdminData();
      } else {
        setImportMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setImportMsg({ type: 'error', text: err.response?.data?.message || 'Import failed. Please check your file.' });
    } finally {
      setImporting(false);
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
        teamLimit: Number(newEvent.teamLimit) || 0,
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

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!certStudentId || !certEventId) {
      setCertMsg({ type: 'error', text: 'Please select both a student and an event.' });
      return;
    }
    try {
      setCertBusy(true);
      setCertMsg(null);
      const res = await API.post('/certificates/generate', {
        studentId: certStudentId,
        eventId: certEventId,
        type: certType
      });
      setCertMsg({ type: 'success', text: res.data.message || 'Certificate generated successfully!' });
      setCertStudentId('');
      setCertEventId('');
    } catch (err) {
      setCertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to generate certificate.' });
    } finally {
      setCertBusy(false);
    }
  };

  const handleDeleteCertificate = async (certId, certLabel) => {
    if (!window.confirm(`Delete certificate "${certLabel}"? This cannot be undone.`)) return;
    try {
      setCertDeleting(certId);
      const res = await API.delete(`/certificates/${certId}`);
      if (res.data.success) {
        setCertificates(prev => prev.filter(c => c._id !== certId));
        setCertMsg({ type: 'success', text: res.data.message || 'Certificate deleted successfully.' });
      }
    } catch (err) {
      setCertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete certificate.' });
    } finally {
      setCertDeleting(null);
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
        teamLimit: Number(editEvent.teamLimit) || 0,
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
      const uName = getStudentName(s, s.email || 'Student');
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

  // Students filtered by the search box inside the Certificates tab
  const certFilteredStudents = students.filter(s => {
    if (!certSearch) return true;
    const q = certSearch.toLowerCase();
    const name = (s.user && s.user.name) || s.name || s.email || '';
    return (s.symposiumCode && s.symposiumCode.toLowerCase().includes(q)) ||
           (s.email && s.email.toLowerCase().includes(q)) ||
           (name && name.toLowerCase().includes(q)) ||
           (s.registerNumber && s.registerNumber.toLowerCase().includes(q)) ||
           (s.collegeName && s.collegeName.toLowerCase().includes(q));
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

        <div className="flex flex-wrap items-center gap-2">
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
          <span className="text-2xl sm:text-3xl font-black text-indigo-400">{stats.checkedInCount || 0} ({stats.attendancePercentage || 0}%)</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'students', label: `Students (${students.length})` },
          { id: 'events', label: `Symposium Events (${events.length})` },
          { id: 'certificates', label: 'Certificates' },
          { id: 'staff', label: `Coordinators & Volunteers (${staffList.length})` },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
          { id: 'messages', label: `Contact Messages (${contactMessages.length})` }
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

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-60"
              >
                {importing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{importing ? 'Importing...' : 'Import Excel'}</span>
              </button>
            </div>
          </div>

          {/* Import result banner */}
          {(importMsg || importResult) && (
            <div className={`p-3 rounded-xl text-xs flex items-start justify-between gap-3 ${
              importMsg?.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              <div className="space-y-1">
                <p className="font-bold">{importMsg?.text}</p>
                {importResult && (
                  <p className="opacity-90">
                    Imported <strong>{importResult.imported}</strong> • Skipped <strong>{importResult.skipped?.length || 0}</strong>
                    {importResult.errors?.length ? ` • Failed <strong>${importResult.errors.length}</strong>` : ''}
                    {importResult.defaultPassword ? ` • Default login password: <strong>${importResult.defaultPassword}</strong>` : ''}
                  </p>
                )}
                {importResult?.skipped?.length > 0 && (
                  <ul className="list-disc list-inside opacity-80 space-y-0.5 max-h-28 overflow-y-auto">
                    {importResult.skipped.slice(0, 10).map((s, i) => (
                      <li key={i}>Row {s.lineNo}: {s.email || s.name} — {s.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { setImportMsg(null); setImportResult(null); }}
                className="shrink-0 p-1 rounded-lg hover:bg-slate-900/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                    const name = getStudentName(s, s.email || 'Student');
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
                      <span className="font-bold text-white">{t.registrations || 0} registered</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">{t.teams || 0} team{(t.teams || 0) !== 1 ? 's' : ''}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">{t.solo || 0} solo</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">{ev.currentRegistrations || 0} registered</p>
                  )}
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
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Issue E-Certificates</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate verified participation / winner certificates for students. Only
              approved &amp; checked-in students are eligible. Certificates instantly appear
              in the student's <strong>Certificates</strong> tab.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-amber-500/30 space-y-4">
            <form onSubmit={handleGenerateCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                  Search &amp; Select Student
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, email, symposium code, register number or college..."
                    value={certSearch}
                    onChange={(e) => setCertSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  required
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full p-3 bg-slate-900 rounded-xl border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">
                    {certSearch
                      ? `— ${certFilteredStudents.length} student(s) found —`
                      : '— Choose a student —'}
                  </option>
                  {certFilteredStudents.map((s) => (
                    <option key={s._id} value={s._id}>
                      {getStudentName(s, s.email || 'Student')} — {s.symposiumCode} — {s.collegeName}
                    </option>
                  ))}
                </select>
                {certSearch && certFilteredStudents.length === 0 && (
                  <p className="text-[10px] text-red-400 mt-1.5">No students match your search.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                  Select Event
                </label>
                <select
                  required
                  value={certEventId}
                  onChange={(e) => setCertEventId(e.target.value)}
                  className="w-full p-3 bg-slate-900 rounded-xl border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Choose an event —</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>{ev.title} ({ev.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                  Certificate Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Participation', value: 'Participation' },
                    { label: '1st Prize', value: 'Winner' },
                    { label: '2nd Prize', value: 'RunnerUp' },
                    { label: '3rd Prize', value: 'Third' }
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCertType(t.value)}
                      className={`py-2.5 px-1 rounded-xl border font-bold text-[11px] transition-all ${
                        certType === t.value
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {certMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  certMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {certMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{certMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={certBusy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {certBusy ? <Loader className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                <span>{certBusy ? 'Generating...' : 'Generate Certificate'}</span>
              </button>
            </form>
          </div>

          {/* Issued certificates list */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Issued Certificates ({certificates.length})</span>
            </h4>
            {certificates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800">
                No certificates issued yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {certificates.map((cert) => {
                  const certLabel = `${getStudentName(cert.student, 'Participant')} — ${cert.event?.title || 'Event'} (${cert.type})`;
                  return (
                    <div key={cert._id} className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {getStudentName(cert.student, 'Participant')}
                          <span className="text-slate-400 font-normal"> — {cert.event?.title || 'Event'}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {cert.certificateNo} • {cert.type}
                          {cert.student?.department ? ` • ${cert.student.department}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCertificate(cert._id, `${cert.certificateNo} (${certLabel})`)}
                        disabled={certDeleting === cert._id}
                        className="shrink-0 flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[10px] font-bold disabled:opacity-50 transition-colors"
                        title="Delete certificate (sent by mistake)"
                      >
                        {certDeleting === cert._id ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        <span>Delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STAFF MANAGEMENT */}
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
              <div key={ann._id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">{ann.category}</span>
                  <h4 className="text-base font-bold text-white truncate">{ann.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{ann.content}</p>
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

      {/* TAB 5: CONTACT MESSAGES INBOX */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Contact Form Inbox</h3>
            <button
              onClick={loadContactMessages}
              disabled={messagesBusy}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{messagesBusy ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {contactMessages.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              No messages received from the contact form yet.
            </div>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((msg, idx) => (
                <div key={msg._id || idx} className="glass-card p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm">{msg.name}</span>
                      <a href={`mailto:${msg.email}`} className="text-indigo-400 text-xs ml-2 hover:underline">{msg.email}</a>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(msg.createdAt || msg.receivedAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-indigo-300 mt-2">{msg.subject}</p>
                  <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
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
              <input type="text" placeholder="Tagline" value={newEvent.tagline} onChange={e => setNewEvent({...newEvent, tagline: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea placeholder="Description" required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Venue (e.g. CS Lab 1)" required value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Time (e.g. 10:00 AM)" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <input type="date" value={newEvent.registrationDeadline} onChange={e => setNewEvent({...newEvent, registrationDeadline: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              </div>
              <input type="number" placeholder="Max Participants (default 100)" value={newEvent.maxParticipants} onChange={e => setNewEvent({...newEvent, maxParticipants: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="number" placeholder="Team Limit (0 = solo only, no teammates)" value={newEvent.teamLimit} onChange={e => setNewEvent({...newEvent, teamLimit: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="text" placeholder="Student Coordinator Name (optional)" value={newEvent.studentName} onChange={e => setNewEvent({...newEvent, studentName: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <input type="text" placeholder="Faculty Coordinator Name (optional)" value={newEvent.facultyName} onChange={e => setNewEvent({...newEvent, facultyName: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea placeholder="Rules & Guidelines (one per line)" value={newEvent.rules} onChange={e => setNewEvent({...newEvent, rules: e.target.value})} rows={4} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Venue" required value={editEvent.venue} onChange={e => setEditEvent({...editEvent, venue: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <input type="date" required value={editEvent.date} onChange={e => setEditEvent({...editEvent, date: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" placeholder="Max Participants" value={editEvent.maxParticipants} onChange={e => setEditEvent({...editEvent, maxParticipants: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
                <input type="number" placeholder="Team Limit (0 = solo only)" value={editEvent.teamLimit} onChange={e => setEditEvent({...editEvent, teamLimit: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
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
                    <div key={reg._id || idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-white text-sm block">{getStudentName(s, 'Unknown')}</span>
                          <span className="text-[10px] text-slate-400 block">{s?.email} • {s?.collegeName}</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-indigo-300 font-mono">{s?.symposiumCode || s?.registerNumber}</span>
                      </div>
                      {reg?.teamMembers?.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          <p className="text-[10px] uppercase tracking-wide font-bold text-cyan-400 mb-1">
                            Team ({reg.teamMembers.length} member{reg.teamMembers.length > 1 ? 's' : ''})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {reg.teamMembers.map((tm, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-200">
                                {tm.name}
                                {tm.registerNumber && <span className="text-cyan-300/70 font-mono">({tm.registerNumber})</span>}
                                <span className="text-slate-500 font-mono">{tm.phone}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500">No teammates added</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">Solo</span>
                        </div>
                      )}
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
