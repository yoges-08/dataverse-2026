import React, { useState } from 'react';
import { 
  Train, Bus, MapPin, Navigation, Clock, ArrowRight, 
  AlertTriangle, CheckCircle2, Compass, Sparkles, ExternalLink,
  Info, CornerRightDown, ShieldCheck
} from 'lucide-react';

/* ==========================================================================
   TRANSIT & SCHEDULE DATA STRUCTURE
   Edit train times, stops, and bus routes below without altering the UI logic.
   ========================================================================== */

export const TRANSIT_DATA = {
  // --------------------------------------------------------------------------
  // 1. ARRIVAL: COMING TO COLLEGE (Morning Transit)
  // --------------------------------------------------------------------------
  arrival: {
    title: 'Coming to College',
    subtitle: 'Morning train and bus travel options arriving at AAMEC Kovilvenni before symposium inauguration.',
    trains: [
      {
        number: '56818',
        name: 'Tiruchchirappalli – Karaikal Passenger',
        type: 'Passenger',
        badgeColor: 'indigo',
        stops: [
          { station: 'Tiruchchirappalli (Trichy)', time: '06:45 AM', action: 'Departs', isCollege: false },
          { station: 'Thanjavur', time: '07:50 AM', action: 'Arrives', isCollege: false },
          { station: 'Kovilvenni (College)', time: '08:25 AM', action: 'Arrives', isCollege: true }
        ],
        note: 'Ideal for students traveling from Trichy, Thanjavur, and intermediate stations.'
      },
      {
        number: '76825',
        name: 'Karaikal – Tiruchchirappalli DEMU',
        type: 'DEMU Express',
        badgeColor: 'purple',
        stops: [
          { station: 'Karaikal', time: '06:35 AM', action: 'Departs', isCollege: false },
          { station: 'Thiruvarur', time: '08:13 AM', action: 'Arrives', isCollege: false },
          { station: 'Kovilvenni (College)', time: '08:55 AM', action: 'Arrives', isCollege: true }
        ],
        note: 'Ideal for students traveling from Karaikal, Nagore, Nagapattinam, and Thiruvarur.'
      }
    ],
    buses: [
      {
        id: 'bus-arr-1',
        name: 'Trichy – Thanjavur – Thiruvarur Route',
        type: 'NH-67 Highway Bus',
        frequency: 'Every 5 to 10 minutes',
        stops: ['Trichy', 'Thanjavur', 'Kovilvenni (College)', 'Thiruvarur'],
        highlight: 'Kovilvenni (College)',
        note: 'Board any TNSTC or Private bus running on NH-67 between Thanjavur and Thiruvarur. Request a drop at Kovilvenni / AAMEC College stop.'
      },
      {
        id: 'bus-arr-2',
        name: 'Nagapattinam – Thiruvarur Route',
        type: 'Highway Express Bus',
        frequency: 'Frequent round-the-clock buses',
        stops: ['Nagapattinam', 'Thiruvarur or Kovilvenni'],
        highlight: 'Thiruvarur or Kovilvenni',
        note: 'Students from coastal districts can take a bus to Thiruvarur, then hop onto any Kovilvenni / Thanjavur bound bus (15-20 min ride).'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. DEPARTURE: GOING HOME (Evening Transit)
  // --------------------------------------------------------------------------
  departure: {
    title: 'Going Home',
    subtitle: 'Evening return travel options after the valedictory function and prize distribution.',
    trains: [
      {
        number: '76819',
        name: 'Karaikal – Tiruchchirappalli DEMU',
        type: 'DEMU Express',
        badgeColor: 'amber',
        stops: [
          { station: 'Kovilvenni (College)', time: '05:00 PM', action: 'Departs', isCollege: true },
          { station: 'Thanjavur', time: '05:30 PM', action: 'Arrives', isCollege: false },
          { station: 'Tiruchchirappalli (Trichy)', time: '06:45 PM', action: 'Arrives (Final Stop)', isCollege: false }
        ],
        note: 'Direct return train toward Thanjavur and Trichy departing right after symposium completion.'
      }
    ],
    alert: {
      type: 'warning',
      text: '⚠️ No return train service available toward Thiruvarur. Students traveling to Thiruvarur should use the bus routes below instead.'
    },
    buses: [
      {
        id: 'bus-dep-1',
        name: 'Thiruvarur – Thanjavur – Trichy Route',
        type: 'NH-67 Return Bus',
        frequency: 'Every 5 to 10 minutes',
        stops: ['Thiruvarur', 'Kovilvenni (College)', 'Thanjavur', 'Trichy'],
        highlight: 'Kovilvenni (College)',
        note: 'Board return buses directly from Kovilvenni College Bus Stop toward Thanjavur and Trichy.'
      },
      {
        id: 'bus-dep-2',
        name: 'Kovilvenni to Thiruvarur / Nagapattinam',
        type: 'Eastbound Return Bus',
        frequency: 'Every 10 to 15 minutes',
        stops: ['Kovilvenni (College)', 'Thiruvarur or Nagapattinam'],
        highlight: 'Kovilvenni (College)',
        note: 'Frequent return buses toward Thiruvarur, Nagapattinam, and Velankanni available at the college main gate bus stop.'
      }
    ]
  }
};

export default function HowToReach() {
  const [activeTab, setActiveTab] = useState('arrival'); // 'arrival' | 'departure'
  const currentData = TRANSIT_DATA[activeTab];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transit &amp; Travel Guide</span>
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Campus on NH-67 Highway</span>
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
          How to Reach <span className="gradient-text">AAMEC</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Convenient train schedules and round-the-clock highway bus routes to help you plan your journey to and from <strong className="text-slate-200">DATAVERSE 2026</strong> at Kovilvenni.
        </p>
      </div>

      {/* Quick Location Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Symposium Venue</span>
            <span className="text-xs font-bold text-white block mt-0.5">AAMEC Campus</span>
            <span className="text-[11px] text-slate-400 block">Kovilvenni, Tiruvarur Dt., TN - 614403</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">Nearest Railway Stop</span>
            <span className="text-xs font-bold text-white block mt-0.5">Kovilvenni Railway Station</span>
            <span className="text-[11px] text-slate-400 block">2-minute walkable distance to gate</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Bus Connectivity</span>
            <span className="text-xs font-bold text-white block mt-0.5">Kovilvenni Bus Stop (NH-67)</span>
            <span className="text-[11px] text-slate-400 block">Direct drop at college main entrance</span>
          </div>
        </div>
      </div>

      {/* Direction Toggle Selector (Arrival vs Departure) */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab('arrival')}
            className={`flex items-center space-x-2 px-5 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'arrival'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌅 Coming to College</span>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline-block">
              Morning
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departure')}
            className={`flex items-center space-x-2 px-5 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'departure'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-600/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌆 Going Home</span>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline-block">
              Evening
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {activeTab === 'arrival'
            ? 'Viewing transit schedules for reaching the college in the morning.'
            : 'Viewing evening return transit options after the symposium valedictory.'}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="space-y-10 animate-fadeIn">
        
        {/* ==================================================================
            SUBSECTION A: TRAIN SCHEDULES (Visual Stepper & Timeline)
            ================================================================== */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Train className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Train Schedules {activeTab === 'arrival' ? '(Morning Arrivals)' : '(Evening Return)'}
              </h2>
            </div>
            <span className="text-xs text-indigo-300 font-semibold self-start sm:self-auto">
              {currentData.trains.length} {currentData.trains.length === 1 ? 'train service' : 'train services'} scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentData.trains.map((train, tIdx) => (
              <div
                key={train.number || tIdx}
                className="glass-card rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all p-5 sm:p-6 space-y-5 flex flex-col justify-between"
              >
                {/* Train Header Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      TRAIN #{train.number}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {train.type}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {train.name}
                  </h3>
                </div>

                {/* Visual Route Stepper */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Stops &amp; Timing Timeline
                  </span>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-emerald-500">
                    {train.stops.map((stop, sIdx) => {
                      const isFirst = sIdx === 0;
                      const isLast = sIdx === train.stops.length - 1;

                      return (
                        <div key={sIdx} className="relative group">
                          {/* Stepper Bullet Icon */}
                          <div
                            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              stop.isCollege
                                ? 'bg-emerald-500 border-white shadow-lg shadow-emerald-500/50 scale-125'
                                : isFirst
                                ? 'bg-indigo-500 border-indigo-300'
                                : isLast
                                ? 'bg-purple-500 border-purple-300'
                                : 'bg-slate-900 border-slate-600'
                            }`}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="min-w-0">
                              <span
                                className={`text-xs sm:text-sm font-bold block ${
                                  stop.isCollege
                                    ? 'text-emerald-300 font-black flex items-center space-x-1.5'
                                    : 'text-white'
                                }`}
                              >
                                <span>{stop.station}</span>
                                {stop.isCollege && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    ★ College
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {stop.action}
                              </span>
                            </div>

                            <div className="shrink-0 self-start sm:self-auto">
                              <span
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                                  stop.isCollege
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-900 text-slate-200 border border-slate-700'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <span>{stop.time}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Helpful train tip */}
                {train.note && (
                  <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800/80">
                    💡 {train.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Special Warning Alert (for Going Home train toward Thiruvarur) */}
          {currentData.alert && (
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-amber-950/25 flex items-start space-x-3.5 shadow-lg shadow-amber-950/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Important Travel Notice
                </h4>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                  {currentData.alert.text}
                </p>
              </div>
            </div>
          )}
        </div>


        {/* ==================================================================
            SUBSECTION B: BUS TRAVEL & HIGHWAY ROUTE PATHS
            ================================================================== */}
        <div className="space-y-5 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Bus Travel Routes {activeTab === 'arrival' ? '(NH-67 Inbound)' : '(NH-67 Outbound)'}
                </h2>
              </div>
            </div>
            <span className="text-xs text-emerald-300 font-semibold self-start sm:self-auto">
              Frequent buses every 5–10 mins
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {currentData.buses.map((bus) => (
              <div
                key={bus.id}
                className="glass-card rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">
                      {bus.type} • {bus.frequency}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {bus.name}
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 self-start sm:self-auto">
                    Continuous Highway Frequency
                  </span>
                </div>

                {/* Connected Route Path (Stations connected with Arrows) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Connected Route Path
                  </span>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {bus.stops.map((stop, sIdx) => {
                      const isTarget = stop.includes('Kovilvenni') || stop === bus.highlight;
                      const isLast = sIdx === bus.stops.length - 1;

                      return (
                        <React.Fragment key={sIdx}>
                          <div
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                              isTarget
                                ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-950/40 font-black'
                                : 'bg-slate-900 border border-slate-700 text-slate-200'
                            }`}
                          >
                            <span>{stop}</span>
                            {isTarget && <span className="text-emerald-400 font-extrabold text-[10px]">📍 Campus</span>}
                          </div>

                          {!isLast && (
                            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Practical Tip */}
                <div className="flex items-start space-x-2 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{bus.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================================================================
            CAMPUS GOOGLE MAPS & INTERACTIVE DIRECTIONS
            ================================================================== */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                GPS Navigation
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
                <span>📍 Live Campus Navigation</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Get step-by-step turn-by-turn navigation directly to Anjalai Ammal Mahalingam Engineering College on Google Maps.
              </p>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Anjalai+Ammal+Mahalingam+Engineering+College%2C+Kovilvenni%2C+Tamil+Nadu"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all shrink-0 self-start sm:self-auto"
            >
              <Navigation className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-64 sm:h-80 w-full">
            <iframe
              title="AAMEC Campus Google Map"
              src="https://www.google.com/maps?q=Anjalai%20Ammal%20Mahalingam%20Engineering%20College%2C%20Kovilvenni%2C%20Tamil%20Nadu&z=15&output=embed"
              className="w-full h-full"
              style={{ border: 0, filter: 'saturate(0.9)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Disclaimer Footer Note */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400">
            ℹ️ <strong className="text-slate-300">Disclaimer:</strong> Timings are indicative and subject to change by Southern Railway &amp; TNSTC authorities. Please verify with local transit authorities or live railway enquiry before travel.
          </p>
        </div>

      </div>
    </div>
  );
}
