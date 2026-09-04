import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import QRScannerModal from '../../components/QRScannerModal';
import StudentBadgeModal from '../../components/StudentBadgeModal';
import CanteenScannerModal, { playFoodAudioFeedback } from '../../components/CanteenScannerModal';
import { 
  QrCode, Search, UserCheck, ShieldCheck, UserPlus, 
  Sparkles, AlertCircle, Camera, Printer, CheckCircle2, Clock, Calendar,
  Salad, ShieldAlert, RefreshCw, Filter
} from 'lucide-react';
import API from '../../services/api';

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin', 'spot', or 'canteen'
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCanteenScannerModal, setShowCanteenScannerModal] = useState(false);
  const [lastVerifiedStudent, setLastVerifiedStudent] = useState(null);
  const [badgeStudent, setBadgeStudent] = useState(null);
  const [events, setEvents] = useState([]);

  // Canteen Food Scanner states
  const [canteenStats, setCanteenStats] = useState({
    totalRegistered: 0,
    totalServed: 0,
    totalRemaining: 0,
    recentServed: []
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [foodSearchCode, setFoodSearchCode] = useState('');
  const [foodServing, setFoodServing] = useState(false);
  const [foodResult, setFoodResult] = useState(null);
  const [recentFilter, setRecentFilter] = useState('');

  // Spot registration form
  const [spotForm, setSpotForm] = useState({
    name: '',
    email: '',
    collegeName: '',
    department: 'Computer Science & Engineering',
    year: 'III',
    phone: '',
    foodPreference: 'Veg',
    accommodationRequired: 'No'
  });
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotMsg, setSpotMsg] = useState({ type: '', text: '' });

  const fetchCanteenStats = async () => {
    try {
      setStatsLoading(true);
      const res = await API.get('/attendance/food-stats');
      if (res.data.success) {
        setCanteenStats({
          totalRegistered: res.data.totalRegistered || 0,
          totalServed: res.data.totalServed || 0,
          totalRemaining: res.data.totalRemaining || 0,
          recentServed: res.data.recentServed || []
        });
      }
    } catch (e) {
      console.error('Failed to load food stats', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    API.get('/events').then((res) => {
      if (res.data.success) setEvents(res.data.events);
    }).catch(() => {});
    fetchCanteenStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'canteen') {
      fetchCanteenStats();
    }
  }, [activeTab]);

  const handleFoodServeManual = async (e) => {
    if (e) e.preventDefault();
    const query = foodSearchCode.trim();
    if (!query) return;

    try {
      setFoodServing(true);
      setFoodResult(null);
      const res = await API.post('/attendance/food-scan', { code: query });
      if (res.data.success) {
        playFoodAudioFeedback('success');
        setFoodResult({
          status: 'approved',
          message: res.data.message,
          student: res.data.student
        });
        setFoodSearchCode('');
        fetchCanteenStats();
      }
    } catch (err) {
      playFoodAudioFeedback('error');
      const data = err.response?.data;
      if (data?.alreadyServed) {
        setFoodResult({
          status: 'already_served',
          message: data.message,
          student: data.student
        });
      } else {
        setFoodResult({
          status: 'error',
          message: data?.message || 'Student record not found.',
          student: null
        });
      }
    } finally {
      setFoodServing(false);
    }
  };

  const toggleEvent = (id) => {
    if (selectedEventIds.includes(id)) {
      setSelectedEventIds(prev => prev.filter(e => e !== id));
      setSpotMsg({ type: '', text: '' });
      return;
    }

    const target = events.find(e => e._id === id);
    if (!target) return;

    const selectedEvents = events.filter(e => selectedEventIds.includes(e._id));
    if (selectedEvents.length >= 4) {
      setSpotMsg({ type: 'error', text: 'Limit reached: Maximum 4 events total allowed (max 2 Tech & 2 Non-Tech).' });
      return;
    }

    const techCount = selectedEvents.filter(e => e.category === 'Technical').length;
    const nonTechCount = selectedEvents.filter(e => e.category === 'Non-Technical').length;

    if (target.category === 'Technical' && techCount >= 2) {
      setSpotMsg({ type: 'error', text: 'Category limit reached: Maximum 2 Technical events allowed.' });
      return;
    }

    if (target.category === 'Non-Technical' && nonTechCount >= 2) {
      setSpotMsg({ type: 'error', text: 'Category limit reached: Maximum 2 Non-Technical events allowed.' });
      return;
    }

    setSpotMsg({ type: '', text: '' });
    setSelectedEventIds(prev => [...prev, id]);
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
        const studentPhone = spotForm.phone ? spotForm.phone.trim() : '';
        setSpotMsg({
          type: 'success',
          text: `Spot Registration & Auto-Check-In Successful! Code: ${res.data.student.symposiumCode}${studentPhone ? ` (Login Password: ${studentPhone})` : ''}`
        });
        setBadgeStudent(res.data.student);
        setSpotForm({
          name: '',
          email: '',
          collegeName: '',
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
            Volunteer On-Site Operations Desk
          </span>
          <h1 className="text-3xl font-black text-white mt-1">
            {activeTab === 'canteen' ? 'Canteen Food Distribution Scanner' : 'Gate Check-In & Spot Registration'}
          </h1>
        </div>

        {activeTab === 'canteen' ? (
          <button
            onClick={() => setShowCanteenScannerModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:opacity-95 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 transition-all flex items-center space-x-2"
          >
            <Salad className="w-5 h-5" />
            <span>Launch Canteen Camera Scanner</span>
          </button>
        ) : (
          <button
            onClick={() => setShowScannerModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <QrCode className="w-5 h-5" />
            <span>Launch QR Scanner Terminal</span>
          </button>
        )}
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
        <button
          onClick={() => setActiveTab('canteen')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'canteen'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Salad className="w-4 h-4" />
          <span>Canteen Food Scanner</span>
          {canteenStats.totalServed > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'canteen' ? 'bg-black/30 text-emerald-100' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {canteenStats.totalServed} Served
            </span>
          )}
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
            <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Last Verified Student:</span>
                <h4 className="text-lg font-bold text-white truncate">{lastVerifiedStudent.name}</h4>
                <p className="text-xs text-slate-400 truncate">{lastVerifiedStudent.symposiumCode} • {lastVerifiedStudent.collegeName}</p>
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
              {spotMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              )}
              <span>{spotMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSpotSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Register the walk-in student to events */}
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>Register for Events (optional — select up to 4)</span>
                  </label>
                  <span className="text-[10px] text-teal-400 font-medium">
                    Limit: Up to 4 events total (max 2 Tech &amp; 2 Non-Tech)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-900 border border-slate-700">
                  {events.length === 0 ? (
                    <span className="text-[10px] text-slate-500 col-span-2 p-2">Loading events...</span>
                  ) : (
                    events.map(ev => {
                      const isFull = ev.maxParticipants > 0 && ev.currentRegistrations >= ev.maxParticipants;
                      const isSelected = selectedEventIds.includes(ev._id);
                      return (
                        <button
                          key={ev._id}
                          type="button"
                          onClick={() => toggleEvent(ev._id)}
                          className={`text-left p-2.5 rounded-lg border text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-teal-600/20 border-teal-500 text-teal-300 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-teal-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="block font-bold truncate">
                              <span className={`inline-block px-1.5 py-0.5 mr-1.5 rounded text-[9px] font-bold ${
                                ev.category === 'Technical' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              }`}>
                                {ev.category === 'Technical' ? 'Tech' : 'Non-Tech'}
                              </span>
                              {ev.title}
                            </span>
                            {isFull && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                                Full (Spot OK)
                              </span>
                            )}
                          </div>
                          <span className="block text-[9px] opacity-70 mt-0.5">{ev.venue}{ev.date ? ` • ${ev.date}` : ''}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                {(() => {
                  const selectedEvents = events.filter(e => selectedEventIds.includes(e._id));
                  const techCount = selectedEvents.filter(e => e.category === 'Technical').length;
                  const nonTechCount = selectedEvents.filter(e => e.category === 'Non-Technical').length;
                  return (
                    <div className="flex items-center justify-between text-[10px] mt-1.5 text-slate-400">
                      <span>
                        Selected: <strong className="text-teal-300">{selectedEventIds.length}/4</strong>{' '}
                        (Tech: <strong className={techCount >= 2 ? 'text-amber-300' : 'text-slate-200'}>{techCount}/2</strong>,{' '}
                        Non-Tech: <strong className={nonTechCount >= 2 ? 'text-amber-300' : 'text-slate-200'}>{nonTechCount}/2</strong>)
                      </span>
                      {selectedEventIds.length === 4 && (
                        <span className="text-teal-400 font-bold">Max 4 events selected</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  minLength={3}
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
                <label className="text-slate-300 font-semibold block mb-1">College Name *</label>
                <input
                  type="text"
                  required
                  value={spotForm.collegeName}
                  onChange={(e) => setSpotForm({ ...spotForm, collegeName: e.target.value })}
                  placeholder="e.g. Anjalai Ammal Mahalingam Engineering College"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department *</label>
                <select
                  required
                  value={spotForm.department}
                  onChange={(e) => setSpotForm({ ...spotForm, department: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Mobile Phone Number * <span className="text-[10px] text-teal-400 font-normal">(Used as Website Login Password)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={spotForm.phone}
                  onChange={(e) => setSpotForm({ ...spotForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Year of Study *</label>
                <select
                  required
                  value={spotForm.year}
                  onChange={(e) => setSpotForm({ ...spotForm, year: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="I">1st Year (I)</option>
                  <option value="II">2nd Year (II)</option>
                  <option value="III">3rd Year (III)</option>
                  <option value="IV">4th Year (IV)</option>
                </select>
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

      {/* TAB 3: CANTEEN FOOD SCANNER (PURE VEG MEALS) */}
      {activeTab === 'canteen' && (
        <div className="space-y-6">
          
          {/* Real-time Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-700/60 bg-slate-900/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Registered Attendees
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-white font-mono">
                  {canteenStats.totalRegistered}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  Eligible For Meal
                </span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  🥗 Veg Meals Served
                </span>
                {canteenStats.totalRegistered > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {Math.round((canteenStats.totalServed / canteenStats.totalRegistered) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {canteenStats.totalServed}
                </span>
                <span className="text-xs text-emerald-300/80 font-medium">
                  Verified &amp; Claimed
                </span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 shadow-lg shadow-amber-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  ⏳ Meals Remaining
                </span>
                <button
                  onClick={fetchCanteenStats}
                  disabled={statsLoading}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Refresh Canteen Stats"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {canteenStats.totalRemaining}
                </span>
                <span className="text-xs text-amber-300/80 font-medium">
                  Yet to Collect
                </span>
              </div>
            </div>
          </div>

          {/* Strict Veg Policy Banner */}
          <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Salad className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>100% Pure Vegetarian Meals</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Symposium Canteen Policy
                  </span>
                </h4>
                <p className="text-xs text-slate-300">
                  All registered attendees receive 1 delicious pure vegetarian lunch meal. Duplicate token claims are strictly blocked.
                </p>
              </div>
            </div>
          </div>

          {/* Scanner & Manual Search Action Card */}
          <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Canteen Counter Terminal
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Scan or Enter Student Meal Pass</h3>
                <p className="text-xs text-slate-400">
                  Scan the student's QR pass or enter their Symposium Code or 10-digit mobile number.
                </p>
              </div>

              <button
                onClick={() => setShowCanteenScannerModal(true)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-900/30 flex items-center justify-center space-x-2 shrink-0 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera Scanner</span>
              </button>
            </div>

            {/* Manual Quick Search Form */}
            <form onSubmit={handleFoodServeManual} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Symposium Code (e.g. DV2026-REG-1001) or 10-digit Phone..."
                  value={foodSearchCode}
                  onChange={(e) => setFoodSearchCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={foodServing || !foodSearchCode.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Salad className="w-4 h-4" />
                <span>{foodServing ? 'Verifying...' : 'Serve Veg Meal'}</span>
              </button>
            </form>

            {/* Active Result Card (Approved / Duplicate / Error) */}
            {foodResult && (
              <div className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
                foodResult.status === 'approved'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xl shadow-emerald-900/30'
                  : foodResult.status === 'already_served'
                  ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-xl shadow-rose-900/30'
                  : 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-xl shadow-amber-900/30'
              }`}>
                <div className="flex items-start space-x-3.5">
                  {foodResult.status === 'approved' && (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {foodResult.status === 'already_served' && (
                    <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  {foodResult.status === 'error' && (
                    <AlertCircle className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        foodResult.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : foodResult.status === 'already_served'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {foodResult.status === 'approved'
                          ? '✓ MEAL APPROVED (1 Veg Lunch)'
                          : foodResult.status === 'already_served'
                          ? '⛔ DUPLICATE BLOCKED (Already Claimed)'
                          : '⚠️ STUDENT NOT FOUND'}
                      </span>
                      <button
                        onClick={() => setFoodResult(null)}
                        className="text-xs opacity-75 hover:opacity-100 underline text-slate-300"
                      >
                        Dismiss
                      </button>
                    </div>

                    <p className="text-base font-bold text-white mt-1.5 leading-snug">
                      {foodResult.message}
                    </p>

                    {foodResult.student && (
                      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="opacity-70 text-[10px] block">Student:</span>
                          <span className="font-bold text-white truncate block">{foodResult.student.name}</span>
                        </div>
                        <div>
                          <span className="opacity-70 text-[10px] block">Pass Code:</span>
                          <span className="font-mono font-bold text-emerald-400">{foodResult.student.symposiumCode}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="opacity-70 text-[10px] block">College / Dept:</span>
                          <span className="text-white truncate block">{foodResult.student.collegeName} ({foodResult.student.department})</span>
                        </div>
                        {foodResult.student.foodServedAt && (
                          <div className="sm:col-span-2 flex items-center space-x-1.5 opacity-90 text-[11px] mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Served at {new Date(foodResult.student.foodServedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {foodResult.student.foodServedBy ? ` by ${foodResult.student.foodServedBy}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Meals Served Table */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Recent Meals Claimed Feed</span>
                </h3>
                <p className="text-xs text-slate-400">Live log of students who collected their lunch</p>
              </div>

              {/* Filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by name or code..."
                  value={recentFilter}
                  onChange={(e) => setRecentFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {(() => {
              const filteredList = (canteenStats.recentServed || []).filter(item => {
                if (!recentFilter.trim()) return true;
                const q = recentFilter.toLowerCase();
                return (
                  (item.name && item.name.toLowerCase().includes(q)) ||
                  (item.symposiumCode && item.symposiumCode.toLowerCase().includes(q)) ||
                  (item.collegeName && item.collegeName.toLowerCase().includes(q))
                );
              });

              if (filteredList.length === 0) {
                return (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    {canteenStats.recentServed?.length === 0
                      ? 'No meals served yet today. Waiting for attendee scans.'
                      : 'No student matches the search filter.'}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase">
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">College &amp; Dept</th>
                        <th className="py-2.5 px-3">Served By</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredList.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                            {item.foodServedAt ? new Date(item.foodServedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-400 whitespace-nowrap">
                            {item.symposiumCode}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                            {item.collegeName} {item.department ? `(${item.department})` : ''}
                          </td>
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                            {item.foodServedBy || 'Canteen Counter'}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Veg Served ✓
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* QR Scanner Modal (Gate Check-In) */}
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

      {/* Canteen Camera Scanner Modal */}
      {showCanteenScannerModal && (
        <CanteenScannerModal
          onClose={() => setShowCanteenScannerModal(false)}
          onScanSuccess={() => {
            fetchCanteenStats();
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
