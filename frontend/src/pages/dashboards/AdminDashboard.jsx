import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, CheckCircle2, Clock, XCircle, Award, Calendar, BarChart3, 
  Search, Filter, Plus, Trash2, Edit, ShieldCheck, QrCode, Download, Bell, Sparkles, UserCheck, User,
  FileBadge, Loader, Code
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

  // Lazy tab loading tracking
  const [loadedTabs, setLoadedTabs] = useState({ students: true, events: true });

  // Action busy states
  const [actionBusyId, setActionBusyId] = useState(null);
  const [eventBusy, setEventBusy] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [staffBusy, setStaffBusy] = useState(false);
  const [annBusy, setAnnBusy] = useState(false);
  const [deletingAnnId, setDeletingAnnId] = useState(null);

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
  const [detailError, setDetailError] = useState('');
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, teamLimit: 0, requiresLanguageChoice: false, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
  });

  // Edit Event Form State
  const [editEvent, setEditEvent] = useState({
    id: '', title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, teamLimit: 0, requiresLanguageChoice: false, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
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
      requiresLanguageChoice: !!ev.requiresLanguageChoice,
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

  // Excel export of students
  const [exporting, setExporting] = useState(false);
  const [exportingByEvent, setExportingByEvent] = useState(false);

  // New Announcement Form State
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General', priority: 'Normal' });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentRes, eventRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/students'),
        API.get('/events')
      ]);

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.stats);
        setCharts(analyticsRes.data.charts);
      }
      if (studentRes.data.success) setStudents(studentRes.data.students);
      if (eventRes.data.success) setEvents(eventRes.data.events);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
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

  const ensureTabDataLoaded = useCallback(async (tabId) => {
    if (loadedTabs[tabId]) return;
    try {
      if (tabId === 'certificates') {
        const res = await API.get('/certificates/all');
        if (res.data.success) setCertificates(res.data.certificates);
      } else if (tabId === 'staff') {
        const res = await API.get('/admin/staff');
        if (res.data.success) setStaffList(res.data.staff);
      } else if (tabId === 'announcements') {
        const res = await API.get('/announcements');
        if (res.data.success) setAnnouncements(res.data.announcements);
      } else if (tabId === 'messages') {
        await loadContactMessages();
      }
      setLoadedTabs(prev => ({ ...prev, [tabId]: true }));
    } catch (err) {
      console.error(`Error loading tab data for ${tabId}:`, err);
    }
  }, [loadedTabs]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    ensureTabDataLoaded(tabId);
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      setActionBusyId(studentId);
      const res = await API.put(`/admin/students/${studentId}/status`, { status: newStatus });
      if (res.data.success) {
        const updatedStudent = res.data.student;
        setStudents(prev => prev.map(s => {
          if (s._id === studentId) {
            return {
              ...s,
              verificationStatus: newStatus,
              rejectionReason: newStatus === 'Rejected' ? (updatedStudent?.rejectionReason || 'Rejected by Admin') : ''
            };
          }
          return s;
        }));
        setStats(prev => {
          if (!prev || !prev.totalStudents) return prev;
          const oldStatus = students.find(s => s._id === studentId)?.verificationStatus;
          if (oldStatus === newStatus) return prev;
          const next = { ...prev };
          if (oldStatus === 'Pending') next.pendingStudents = Math.max(0, (next.pendingStudents || 1) - 1);
          if (oldStatus === 'Approved') next.approvedStudents = Math.max(0, (next.approvedStudents || 1) - 1);
          if (oldStatus === 'Rejected') next.rejectedStudents = Math.max(0, (next.rejectedStudents || 1) - 1);
          if (newStatus === 'Pending') next.pendingStudents = (next.pendingStudents || 0) + 1;
          if (newStatus === 'Approved') next.approvedStudents = (next.approvedStudents || 0) + 1;
          if (newStatus === 'Rejected') next.rejectedStudents = (next.rejectedStudents || 0) + 1;
          return next;
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update student status.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      setActionBusyId(studentId);
      const res = await API.delete(`/admin/students/${studentId}`);
      if (res.data.success) {
        const targetStudent = students.find(s => s._id === studentId);
        setStudents(prev => prev.filter(s => s._id !== studentId));
        setStats(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.totalStudents = Math.max(0, (next.totalStudents || 1) - 1);
          if (targetStudent?.verificationStatus === 'Pending') {
            next.pendingStudents = Math.max(0, (next.pendingStudents || 1) - 1);
          } else if (targetStudent?.verificationStatus === 'Approved') {
            next.approvedStudents = Math.max(0, (next.approvedStudents || 1) - 1);
          } else if (targetStudent?.verificationStatus === 'Rejected') {
            next.rejectedStudents = Math.max(0, (next.rejectedStudents || 1) - 1);
          }
          if (targetStudent?.isCheckedIn) {
            next.checkedInCount = Math.max(0, (next.checkedInCount || 1) - 1);
          }
          next.attendancePercentage = next.totalStudents > 0 ? Math.round(((next.checkedInCount || 0) / next.totalStudents) * 100) : 0;
          return next;
        });
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setEventBusy(true);
      const res = await API.post('/events', {
        ...newEvent,
        teamLimit: Number(newEvent.teamLimit) || 0,
        requiresLanguageChoice: !!newEvent.requiresLanguageChoice,
        rules: (newEvent.rules || '').split('\n'),
        facultyCoordinator: { name: newEvent.facultyName, phone: newEvent.facultyPhone },
        studentCoordinator: { name: newEvent.studentName, phone: newEvent.studentPhone },
        prizes: { first: newEvent.firstPrize, second: newEvent.secondPrize, third: newEvent.thirdPrize }
      });
      if (res.data.success && res.data.event) {
        setEvents(prev => [...prev, res.data.event]);
        setShowEventModal(false);
        setNewEvent({
          title: '', category: 'Technical', tagline: '', description: '', rules: '', venue: '', date: '2026-09-12', time: '', registrationDeadline: '2026-09-11', maxParticipants: 100, teamLimit: 0, requiresLanguageChoice: false, facultyName: '', facultyPhone: '', studentName: '', studentPhone: '', firstPrize: '', secondPrize: '', thirdPrize: ''
        });
        setStats(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          if (res.data.event.category === 'Technical') {
            next.technicalEvents = (next.technicalEvents || 0) + 1;
          } else {
            next.nonTechnicalEvents = (next.nonTechnicalEvents || 0) + 1;
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error creating event:', err);
      alert(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setEventBusy(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setStaffBusy(true);
      const res = await API.post('/admin/staff', newStaff);
      if (res.data.success) {
        if (res.data.user) {
          setStaffList(prev => [...prev, res.data.user]);
        }
        setShowStaffModal(false);
        setNewStaff({ name: '', email: '', password: '', role: 'coordinator' });
      }
    } catch (err) {
      console.error('Error creating staff:', err);
      alert(err.response?.data?.message || 'Failed to create staff.');
    } finally {
      setStaffBusy(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setAnnBusy(true);
      const res = await API.post('/announcements', newAnn);
      if (res.data.success) {
        if (res.data.announcement) {
          setAnnouncements(prev => [res.data.announcement, ...prev]);
        }
        setShowAnnModal(false);
        setNewAnn({ title: '', content: '', category: 'General', priority: 'Normal' });
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setAnnBusy(false);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setDeletingAnnId(annId);
      const res = await API.delete(`/announcements/${annId}`);
      if (res.data.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== annId));
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    } finally {
      setDeletingAnnId(null);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove all its registrations too.`)) return;
    try {
      setDeletingEventId(eventId);
      const res = await API.delete(`/events/${eventId}`);
      if (res.data.success) {
        const targetEvent = events.find(e => e._id === eventId);
        setEvents(prev => prev.filter(ev => ev._id !== eventId));
        setStats(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          if (targetEvent?.category === 'Technical') {
            next.technicalEvents = Math.max(0, (next.technicalEvents || 1) - 1);
          } else if (targetEvent?.category === 'Non-Technical') {
            next.nonTechnicalEvents = Math.max(0, (next.nonTechnicalEvents || 1) - 1);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setDeletingEventId(null);
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
      const certRes = await API.get('/certificates/all');
      if (certRes.data.success) {
        setCertificates(certRes.data.certificates);
      }
      setStats(prev => ({ ...prev, certificatesCount: (prev?.certificatesCount || 0) + 1 }));
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
        setStats(prev => ({ ...prev, certificatesCount: Math.max(0, (prev?.certificatesCount || 1) - 1) }));
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
      setEventBusy(true);
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
        requiresLanguageChoice: !!editEvent.requiresLanguageChoice,
        facultyCoordinator: { name: editEvent.facultyName, phone: editEvent.facultyPhone },
        studentCoordinator: { name: editEvent.studentName, phone: editEvent.studentPhone },
        prizes: { first: editEvent.firstPrize, second: editEvent.secondPrize, third: editEvent.thirdPrize }
      });
      if (res.data.success && res.data.event) {
        setEvents(prev => prev.map(ev => ev._id === editEvent.id ? res.data.event : ev));
        setShowEditEventModal(false);
      }
    } catch (err) {
      console.error('Error updating event:', err);
      alert(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setEventBusy(false);
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
      }
    } catch (err) {
      console.error('Error fetching event registrations:', err);
      setDetailError(err.response?.data?.message || 'Could not load registrations. The server returned an error.');
      setShowEventDetail(true);
      setEventDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await API.get('/admin/students/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `DATAVERSE_Student_Registrations_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Could not export students. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByEventExcel = async () => {
    setExportingByEvent(true);
    try {
      const res = await API.get('/admin/students/export-by-event', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `DATAVERSE_Registrations_By_Event_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export by event failed:', err);
      alert('Could not export registrations by event. Please try again.');
    } finally {
      setExportingByEvent(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return students.filter(s => {
      const matchesSearch = !term ||
        (s.symposiumCode && s.symposiumCode.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.collegeName && s.collegeName.toLowerCase().includes(term)) ||
        (s.registerNumber && s.registerNumber.toLowerCase().includes(term)) ||
        (s.user && s.user.name && s.user.name.toLowerCase().includes(term));
      const matchesStatus = !statusFilter || s.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  // Students filtered by the search box inside the Certificates tab
  const certFilteredStudents = useMemo(() => {
    if (!certSearch.trim()) return students;
    const q = certSearch.trim().toLowerCase();
    return students.filter(s => {
      const name = (s.user && s.user.name) || s.name || s.email || '';
      return (s.symposiumCode && s.symposiumCode.toLowerCase().includes(q)) ||
             (s.email && s.email.toLowerCase().includes(q)) ||
             (name && name.toLowerCase().includes(q)) ||
             (s.registerNumber && s.registerNumber.toLowerCase().includes(q)) ||
             (s.collegeName && s.collegeName.toLowerCase().includes(q));
    });
  }, [students, certSearch]);


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
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
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
            onClick={() => handleTabChange(tab.id)}
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
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((s) => {
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

                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedStudentForBadge(s)}
                            className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                            title="Preview Badge & QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {s.verificationStatus !== 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(s._id, 'Approved')}
                              disabled={actionBusyId === s._id}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                            >
                              {actionBusyId === s._id ? <Loader className="w-3 h-3 animate-spin" /> : null}
                              <span>Approve</span>
                            </button>
                          )}

                          {s.verificationStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleStatusChange(s._id, 'Rejected')}
                              disabled={actionBusyId === s._id}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                            >
                              {actionBusyId === s._id ? <Loader className="w-3 h-3 animate-spin" /> : null}
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteStudent(s._id)}
                            disabled={actionBusyId === s._id}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete student"
                          >
                            {actionBusyId === s._id ? <Loader className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4" />}
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xl font-bold text-white">Manage Symposium Competitions</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportByEventExcel}
                disabled={exportingByEvent}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingByEvent ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{exportingByEvent ? 'Exporting...' : 'Export by Event'}</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Event</span>
              </button>
            </div>
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
                      disabled={deletingEventId === ev._id}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs border border-red-500/30 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingEventId === ev._id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>{deletingEventId === ev._id ? 'Deleting...' : 'Delete'}</span>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
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
          <div className="flex items-center justify-between flex-wrap gap-3">
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
                  disabled={deletingAnnId === ann._id}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete announcement"
                >
                  {deletingAnnId === ann._id ? <Loader className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4" />}
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
      {showEventModal && createPortal(
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
              <label className="flex items-center space-x-2 text-xs text-slate-300 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEvent.requiresLanguageChoice}
                  onChange={e => setNewEvent({...newEvent, requiresLanguageChoice: e.target.checked})}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Require Language Selection (Python, C, C++)</span>
              </label>
              <textarea placeholder="Rules & Guidelines (one per line)" value={newEvent.rules} onChange={e => setNewEvent({...newEvent, rules: e.target.value})} rows={4} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={eventBusy} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5">
                  {eventBusy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{eventBusy ? 'Saving...' : 'Save Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Staff Modal */}
      {showStaffModal && createPortal(
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
                <option value="co_organizer">Co-Organizer (view-only)</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowStaffModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={staffBusy} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5">
                  {staffBusy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{staffBusy ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Announcement Modal */}
      {showAnnModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4">
            <h3 className="text-lg font-bold text-white">Publish Live Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <input type="text" placeholder="Title" required value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <textarea placeholder="Announcement Content" required value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAnnModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={annBusy} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5">
                  {annBusy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{annBusy ? 'Publishing...' : 'Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    {/* Edit Event Modal */}
      {showEditEventModal && createPortal(
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
              <label className="flex items-center space-x-2 text-xs text-slate-300 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editEvent.requiresLanguageChoice}
                  onChange={e => setEditEvent({...editEvent, requiresLanguageChoice: e.target.checked})}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Require Language Selection (Python, C, C++)</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditEventModal(false)} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={eventBusy} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5">
                  {eventBusy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{eventBusy ? 'Updating...' : 'Update Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Event Registrants Modal */}
      {showEventDetail && (eventDetail || detailError) && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 border border-indigo-500/30 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{eventDetail?.event?.title || 'Registrants'}</h3>
                <span className="text-[10px] uppercase font-bold text-indigo-400">{eventDetail?.event?.category || ''}{eventDetail?.event?.venue ? ` • ${eventDetail.event.venue}` : ''}</span>
              </div>
              <button onClick={() => setShowEventDetail(false)} className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white">✕</button>
            </div>

            {detailLoading ? (
              <p className="text-xs text-slate-400">Loading registrations...</p>
            ) : detailError ? (
              <div className="p-6 text-center text-xs text-red-400 bg-red-500/10 rounded-xl border border-red-500/30 space-y-2">
                <p className="font-bold">Could not open registrations</p>
                <p>{detailError}</p>
                <p className="text-[10px] text-slate-500">If this keeps happening, check the server logs — the registrations endpoint returned an error.</p>
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
                          {(g.registrations || []).map(r => (
                            <div key={r._id || idx} className="flex items-center justify-between gap-3 text-[10px]">
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
