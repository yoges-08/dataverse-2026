import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import QRScannerModal from '../../components/QRScannerModal';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import { 
  QrCode, Search, UserCheck, ShieldCheck, UserPlus, 
  Sparkles, AlertCircle, Camera, Printer, CheckCircle2, Clock, Calendar 
} from 'lucide-react';
import API from '../../services/api';

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' or 'spot'
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [lastVerifiedStudent, setLastVerifiedStudent] = useState(null);
  const [badgeStudent, setBadgeStudent] = useState(null);
  const [events, setEvents] = useState([]);

  // Spot registration form
  const [spotForm, setSpotForm] = useState({
    name: '',
    email: '',
    registerNumber: '',
    collegeName: 'Anjalai Ammal Mahalingam Engineering College',
    department: 'Computer Science & Engineering',
    year: 'III',
    phone: '',
    foodPreference: 'Veg',
    accommodationRequired: 'No'
  });
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotMsg, setSpotMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    API.get('/events').then((res) => {
      if (res.data.success) setEvents(res.data.events);
    }).catch(() => {});
  }, []);

  const toggleEvent = (id) => {
    setSelectedEventIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSpotSubmit = async (e) => {
    e.preventDefault();
    try {
      setSpotLoading(true);
      setSpotMsg({ type: '', text: '' });

      const res = await API.post('/student/spot-registration', {
        ...spotForm,
        eventIds: selectedEventIds
      });
      if (res.data.success) {
        setSpotMsg({ type: 'success', text: `Spot Registration & Auto-Check-In Successful! Code: ${res.data.student.symposiumCode}` });
        setBadgeStudent(res.data.student);
        setSpotForm({
          name: '',
          email: '',
          registerNumber: '',
          collegeName: 'Anjalai Ammal Mahalingam Engineering College',
          department: 'Computer Science & Engineering',
          year: 'III',
          phone: '',
          foodPreference: 'Veg',
          accommodationRequired: 'No'
        });
        setSelectedEventIds([]);
      }
    } catch (err) {
      setSpotMsg({ type: 'error', text: err.response?.data?.message || 'Spot registration failed' });
    } finally {
      setSpotLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Volunteer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
            Volunteer On-Site Verification Desk
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Gate Check-In & Spot Registration</h1>
        </div>

        <button
          onClick={() => setShowScannerModal(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center space-x-2"
        >
          <QrCode className="w-5 h-5" />
          <span>Launch QR Scanner Terminal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'checkin'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Gate Check-In & Verification
        </button>
        <button
          onClick={() => setActiveTab('spot')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'spot'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Spot Registration Desk (Walk-In Students)
        </button>
      </div>

      {/* TAB 1: GATE CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-indigo-500/30 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white">Ready for Scanning Student Tickets</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the Launch QR Scanner button or enter a Symposium Code (e.g. DV2026-REG-1001) to verify college ID and check in participants.
            </p>

            <button
              onClick={() => setShowScannerModal(true)}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30"
            >
              Start Verification Scan
            </button>
          </div>

          {lastVerifiedStudent && (
            <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Last Verified Student:</span>
                <h4 className="text-lg font-bold text-white">{lastVerifiedStudent.name}</h4>
                <p className="text-xs text-slate-400">{lastVerifiedStudent.symposiumCode} • {lastVerifiedStudent.collegeName}</p>
              </div>
              <button
                onClick={() => setBadgeStudent(lastVerifiedStudent)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Student Badge</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPOT REGISTRATION FOR NON-REGISTERED WALK-IN STUDENTS */}
      {activeTab === 'spot' && (
        <div className="glass-card p-8 rounded-3xl border border-teal-500/30 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">On-The-Spot Registration</span>
            <h2 className="text-2xl font-black text-white">Register Non-Registered Walk-In Student</h2>
            <p className="text-xs text-slate-400">Creates student account, generates DV2026-SPOT code & instant badge, and approves gate entry in 1 click.</p>
          </div>

          {spotMsg.text && (
            <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
              spotMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{spotMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSpotSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Register the walk-in student to events */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Register for Events (optional — select one or more)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-900 border border-slate-700">
                  {events.length === 0 ? (
                    <span className="text-[10px] text-slate-500 col-span-2 p-2">Loading events...</span>
                  ) : (
                    events.map(ev => (
                      <button
                        key={ev._id}
                        type="button"
                        onClick={() => toggleEvent(ev._id)}
                        className={`text-left p-2.5 rounded-lg border text-[10px] font-semibold transition-all ${
                          selectedEventIds.includes(ev._id)
                            ? 'bg-teal-600/20 border-teal-500 text-teal-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-teal-500/50'
                        }`}
                      >
                        <span className="block font-bold">{ev.title}</span>
                        <span className="block text-[9px] opacity-70">{ev.venue}{ev.date ? ` • ${ev.date}` : ''}</span>
                      </button>
                    ))
                  )}
                </div>
                {selectedEventIds.length > 0 && (
                  <span className="text-[9px] text-teal-300 mt-1 block">Selected: {selectedEventIds.length} event(s)</span>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={spotForm.name}
                  onChange={(e) => setSpotForm({ ...spotForm, name: e.target.value })}
                  placeholder="e.g. Santhosh Kumar"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={spotForm.email}
                  onChange={(e) => setSpotForm({ ...spotForm, email: e.target.value })}
                  placeholder="student@gmail.com"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">College Register Number *</label>
                <input
                  type="text"
                  required
                  value={spotForm.registerNumber}
                  onChange={(e) => setSpotForm({ ...spotForm, registerNumber: e.target.value })}
                  placeholder="820421104088"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">College Name *</label>
                <input
                  type="text"
                  required
                  value={spotForm.collegeName}
                  onChange={(e) => setSpotForm({ ...spotForm, collegeName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={spotForm.department}
                  onChange={(e) => setSpotForm({ ...spotForm, department: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={spotForm.phone}
                  onChange={(e) => setSpotForm({ ...spotForm, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={spotLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-teal-600/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>{spotLoading ? 'Processing Spot Entry...' : 'Create Spot Registration & Auto-Check-In'}</span>
            </button>
          </form>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScannerModal && (
        <QRScannerModal
          onClose={() => setShowScannerModal(false)}
          onVerifySuccess={(verifiedStudent) => {
            setLastVerifiedStudent(verifiedStudent);
            setBadgeStudent(verifiedStudent);
            setShowScannerModal(false);
          }}
        />
      )}

      {/* Student Badge Preview */}
      {badgeStudent && (
        <StudentBadgeModal
          student={badgeStudent}
          onClose={() => setBadgeStudent(null)}
        />
      )}

    </div>
  );
}
