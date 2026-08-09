import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import { 
  Sparkles, Calendar, Users, Award, ShieldCheck, 
  ArrowRight, Code, Flame, MapPin, CheckCircle2, ChevronRight, Zap, Building2
} from 'lucide-react';
import API from '../services/api';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'super_admin': return '/dashboard/admin';
      case 'coordinator': return '/dashboard/coordinator';
      case 'volunteer': return '/dashboard/volunteer';
      default: return '/dashboard/student';
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-24 pb-16 overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* Glowing Background Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-600/30 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          
          {/* College Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-3xl blur opacity-45 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 glass-card rounded-3xl p-3 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden shadow-2xl bg-slate-950/90">
                <img
                  src="/college_logo.png"
                  alt="AAMEC Official College Emblem"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* College Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900/90 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              Anjalai Ammal Mahalingam Engineering College, Kovilvenni
            </span>
          </div>

          {/* Main Title & Tagline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none">
              DATA<span className="gradient-text">VERSE</span> <span className="text-amber-400">2026</span>
            </h1>
            <p className="text-lg sm:text-2xl font-bold tracking-widest uppercase text-amber-300">
              Innovate • Inspire • Create
            </p>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
              National Level Technical & Non-Technical Symposium conducted by Department of Artificial Intelligence and Data Science (AI & DS).
            </p>
          </div>

          {/* Symposium Date & Deadline Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-800/30 to-blue-900/30 border border-blue-400/40 shadow-xl">
              <Calendar className="w-5 h-5 text-blue-300" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Symposium</span>
                <span className="text-base sm:text-lg font-black text-white">12 / 09 / 2026</span>
              </div>
            </div>
            <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-700/20 to-amber-600/20 border border-amber-400/40 shadow-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div className="text-left">
                <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">Registration Deadline</span>
                <span className="text-base sm:text-lg font-black text-white">05 / 09 / 2026</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="btn-glow w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-base shadow-xl shadow-indigo-600/35 hover:scale-105 transition-transform flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-glow w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-base shadow-xl shadow-indigo-600/35 hover:scale-105 transition-transform flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>Register Now</span>
              </Link>
            )}

            <Link
              to="/events"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-base transition-all hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </Link>
          </div>

          {/* Countdown Timer */}
          <div className="pt-6">
            <CountdownTimer targetDate="2026-09-12T09:00:00" />
          </div>

        </div>

      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Code, title: "Technical Excellence", desc: "QuizEE, Agentic AI, and Research Paper Presentations." },
            { icon: Flame, title: "Non-Technical Fest", desc: "Layman Vibes, Luminas Fest, and E-Sports Gaming Arena." },
            { icon: ShieldCheck, title: "Instant QR Check-In", desc: "Digital tickets, QR verification, and automated ID badges." },
            { icon: Award, title: "E-Certificates", desc: "Verified PDF certificates issued to all participants." }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Event Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Featured Symposium Events</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Technical & Non-Technical Lineup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.slice(0, 6).map((ev) => (
            <div key={ev._id} className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/40 transition-all group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={ev.bannerImage}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ev.category === 'Technical' ? 'bg-indigo-600 text-white' : 'bg-pink-600 text-white'
                  }`}>
                    {ev.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{ev.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-semibold">{ev.venue}</span>
                  <Link to="/events" className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Institution Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="glass-card rounded-3xl p-8 sm:p-12 border border-amber-500/25">
          <div className="space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Host Institution</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Anjalai Ammal Mahalingam Engineering College
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Established in Kovilvenni, Tiruvarur District, Tamil Nadu, AAMEC is a premier engineering institution committed to academic excellence, state-of-the-art laboratory infrastructure, research innovation, and holistic student development.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>NAAC Accredited Campus</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High-Speed Wi-Fi & AI Labs</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bus Connectivity across DT</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modern 1200-Seat Auditorium</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
