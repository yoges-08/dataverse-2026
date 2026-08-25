import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventDetailModal from '../components/EventDetailModal';
import { Search, Filter, Sparkles, Trophy, Calendar, MapPin, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryOrder = { 'Technical': 0, 'Non-Technical': 1 };
  const filteredEvents = events
    .filter(e => {
      const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const catDiff = (categoryOrder[a.category] ?? 2) - (categoryOrder[b.category] ?? 2);
      return catDiff !== 0 ? catDiff : a.title.localeCompare(b.title);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            DATAVERSE 2026 Event Competitions
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>No Registration Fee • ₹0 Free</span>
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white">Symposium Events Catalog</h1>
        <p className="text-sm text-slate-400">
          Participate in technical AI challenges, quizzes, paper presentations, and non-technical creative events to win exciting certificates
        </p>
      </div>

      {/* Free Entry & Registration limit notice */}
      <div className="max-w-3xl mx-auto -mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span><span className="font-black">No Registration Fee:</span> Entry is 100% Free for all participants!</span>
        </div>
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold text-center">
          <Trophy className="w-4 h-4 shrink-0" />
          <span>Up to <span className="font-black">4 events</span> total (max <span className="font-black">2 Tech</span> & <span className="font-black">2 Non-Tech</span>).</span>
        </div>
      </div>

      {/* Team Management notice */}
      <div className="max-w-3xl mx-auto mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
        <Zap className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-black">Team Management:</span> After registering, join or create a team from your registered events in the{' '}
          <Link to="/team-management" className="font-black underline hover:text-indigo-200">Team Management</Link> tab.
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Technical', 'Non-Technical'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'All' ? 'All Competitions' : `${cat} Events`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search event name or rule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-slate-900 animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {filteredEvents.map((ev) => (
            <div
              key={ev._id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group"
            >
              <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={ev.bannerImage}
                  alt={ev.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ev.category === 'Technical' ? 'bg-indigo-600 text-white' : 'bg-pink-600 text-white'
                  }`}>
                    {ev.category}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium mb-2">{ev.tagline}</p>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{ev.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-400">
                    {ev.date && (
                      <span className="inline-flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>{ev.date.split('-').reverse().join('/')}</span>
                      </span>
                    )}
                    {ev.venue && (
                      <span className="inline-flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-pink-400" />
                        <span>{ev.venue}</span>
                      </span>
                    )}
                    {ev.facultyCoordinator?.name && (
                      <span className="inline-flex items-center space-x-1">
                        <span className="text-emerald-400 font-bold">Faculty: {ev.facultyCoordinator.name}</span>
                      </span>
                    )}
                    {ev.studentCoordinator?.name && (
                      <span className="inline-flex items-center space-x-1">
                        <span className="text-cyan-400 font-bold">Coord: {ev.studentCoordinator.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedEvent(ev)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-purple-600/40 hover:shadow-purple-500/60 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>View Rules & Register</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal View */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegisterSuccess={() => {
            fetchEvents();
          }}
        />
      )}

    </div>
  );
}
