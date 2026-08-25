import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import CertificateModal from '../../components/CertificateModal';
import BlurImage from '../../components/BlurImage';
import {
  User, QrCode, CheckCircle2, AlertCircle, Award,
  Calendar, Bell, Download, ShieldCheck, Home
} from 'lucide-react';
import API from '../../services/api';

export default function StudentDashboard() {
  const { student, user, fetchMe } = useContext(AuthContext);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showBadge, setShowBadge] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [regRes, certRes, annRes] = await Promise.all([
        API.get('/student/registered-events'),
        API.get('/certificates/my-certificates'),
        API.get('/announcements')
      ]);

      if (regRes.data.success) setRegisteredEvents(regRes.data.registrations);
      if (certRes.data.success) setCertificates(certRes.data.certificates);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <p>Loading student profile...</p>
      </div>
    );
  }

  const technicalCount = registeredEvents.filter(r => r.event?.category === 'Technical').length;
  const nonTechnicalCount = registeredEvents.filter(r => r.event?.category === 'Non-Technical').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.name || student.email}</h1>
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/40">
                {student.symposiumCode}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {student.department} • Year {student.year} • {student.collegeName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Link
            to="/"
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <button
            onClick={() => setShowBadge(true)}
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>View Digital Badge & QR Pass</span>
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Registered Events */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Events</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-white">{registeredEvents.length}</span>
              <span className="text-xs font-bold text-slate-500">/ 4 max</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{technicalCount}/2 Tech • {nonTechnicalCount}/2 Non-Tech</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Card 2: Verification Status */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Status</span>
            <span className={`text-lg font-extrabold ${
              student.verificationStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {student.verificationStatus}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: Attendance Status */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Venue Attendance</span>
            <span className={`text-lg font-extrabold ${student.isCheckedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
              {student.isCheckedIn ? 'Checked-In' : 'Pending Gate Scan'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Card 4: Certificates */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificates Issued</span>
            <span className="text-3xl font-black text-amber-400">{certificates.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
        </div>

      </div>

      {/* Main Grid: My Events & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Col 1 & 2: Registered Events List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xl font-bold text-white">My Registered Events</h3>
            <span className="text-xs text-slate-400 font-medium">
              {registeredEvents.length}/4 events ({technicalCount}/2 Technical, {nonTechnicalCount}/2 Non-Technical)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You can register for a maximum of <span className="font-black">4 events</span> total (at most <span className="font-black">2 Technical</span> & <span className="font-black">2 Non-Technical</span>).{' '}
              {registeredEvents.length >= 4
                ? 'You have reached your overall registration limit (4/4 events).'
                : `You have ${4 - registeredEvents.length} registration slot${4 - registeredEvents.length > 1 ? 's' : ''} remaining (${Math.max(0, 2 - technicalCount)} Technical, ${Math.max(0, 2 - nonTechnicalCount)} Non-Technical).`}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <span className="font-black">Team Management:</span> You can now join or create a team for your registered events in the{' '}
              <Link to="/team-management" className="font-black underline hover:text-indigo-200">Team Management</Link> tab.
            </span>
          </div>

          {registeredEvents.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-400 space-y-3">
              <Calendar className="w-10 h-10 text-indigo-400 mx-auto opacity-50" />
              <p className="text-sm">You haven't registered for any symposium events yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registeredEvents.map((reg) => {
                const ev = reg.event;
                if (!ev) return null;
                return (
                  <div key={reg._id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <BlurImage
                        src={ev.bannerImage}
                        alt={ev.title}
                        loading="lazy"
                        wrapperClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-700 shrink-0"
                        className="w-full h-full object-cover"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 block">{ev.category}</span>
                        <h4 className="text-base font-bold text-white">{ev.title}</h4>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                      {reg.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* E-Certificates Section */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xl font-bold text-white">My Symposium E-Certificates</h3>
            {certificates.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center text-xs text-slate-400">
                Certificates will be generated after event verification and completion by event coordinators.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div key={cert._id} className="glass-card p-5 rounded-2xl border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">{cert.type} Certificate</span>
                      <h4 className="text-sm font-bold text-white">{cert.event?.title || 'Symposium Event'}</h4>
                      <span className="text-[11px] font-mono text-slate-400">{cert.certificateNo}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                      title="Download PDF Certificate"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Announcements Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-bold text-white">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3>Live Announcements</h3>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann._id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">{ann.category}</span>
                  <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Student Badge Modal */}
      {showBadge && (
        <StudentBadgeModal
          student={student}
          onClose={() => setShowBadge(false)}
        />
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

    </div>
  );
}
