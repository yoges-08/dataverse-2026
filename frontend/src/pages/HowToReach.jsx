import React, { useState } from 'react';
import { 
  Train, Bus, MapPin, Navigation, Clock, ArrowRight, 
  AlertTriangle, CheckCircle2, Compass, ExternalLink,
  Info
} from 'lucide-react';

/* ==========================================================================
   TRANSIT & TRAVEL DATA (DATAVERSE 2026)
   Easily edit train schedules and bus route details below.
   ========================================================================== */

export const TRANSIT_DATA = {
  // --------------------------------------------------------------------------
  // 1. SECTION 1: COMING TO COLLEGE (Morning Arrivals)
  // --------------------------------------------------------------------------
  arrival: {
    title: 'Coming to College',
    subtitle: 'Morning train and bus travel options arriving at AAMEC Kovilvenni before the symposium inauguration.',
    trains: [
      {
        number: '56818',
        name: 'Tiruchchirappalli – Karaikal Passenger',
        type: 'Passenger',
        stops: [
          { station: 'Tiruchchirappalli (Trichy)', time: '6:45 AM', action: 'Departs', isCollege: false },
          { station: 'Thanjavur', time: '7:50 AM', action: 'Arrives', isCollege: false },
          { station: 'Kovilvenni (College)', time: '8:25 AM', action: 'Arrives', isCollege: true }
        ],
        note: 'Best option for students traveling from Trichy, Thanjavur, and nearby stations.'
      },
      {
        number: '76825',
        name: 'Karaikal – Tiruchchirappalli DEMU',
        type: 'DEMU',
        stops: [
          { station: 'Karaikal', time: '6:35 AM', action: 'Departs', isCollege: false },
          { station: 'Thiruvarur', time: '8:13 AM', action: 'Arrives', isCollege: false },
          { station: 'Kovilvenni (College)', time: '8:55 AM', action: 'Arrives', isCollege: true }
        ],
        note: 'Best option for students traveling from Karaikal, Nagapattinam, and Thiruvarur.'
      }
    ],
    buses: [
      {
        id: 'bus-arr-1',
        title: 'Route 1',
        name: 'Trichy → Thanjavur → Kovilvenni → Thiruvarur',
        stops: ['Trichy', 'Thanjavur', 'Kovilvenni', 'Thiruvarur'],
        highlight: 'Kovilvenni',
        note: 'Board any TNSTC or Private bus on NH-67 running between Thanjavur and Thiruvarur. Request drop at Kovilvenni (AAMEC College Stop).'
      },
      {
        id: 'bus-arr-2',
        title: 'Route 2',
        name: 'Nagapattinam → Thiruvarur or Kovilvenni',
        stops: ['Nagapattinam', 'Thiruvarur or Kovilvenni'],
        highlight: 'Thiruvarur or Kovilvenni',
        note: 'Students from coastal regions can take a bus to Thiruvarur, then take any Kovilvenni / Thanjavur bound bus (15-20 min ride).'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. SECTION 2: GOING HOME (Evening Return)
  // --------------------------------------------------------------------------
  departure: {
    title: 'Going Home',
    subtitle: 'Evening return travel options after symposium completion, valedictory, and prize distribution.',
    trains: [
      {
        number: '76819',
        name: 'Karaikal – Tiruchchirappalli DEMU',
        type: 'DEMU',
        stops: [
          { station: 'Kovilvenni (College)', time: '5:00 PM', action: 'Departs', isCollege: true },
          { station: 'Thanjavur', time: '5:30 PM', action: 'Arrives', isCollege: false },
          { station: 'Tiruchchirappalli (Trichy)', time: '6:45 PM', action: 'Arrives (Final Stop)', isCollege: false }
        ],
        note: 'Direct evening return train toward Thanjavur and Trichy departing directly from Kovilvenni station.'
      }
    ],
    alert: {
      type: 'warning',
      text: '⚠️ No return train service available toward Thiruvarur. Students traveling to Thiruvarur should use the bus routes below instead.'
    },
    buses: [
      {
        id: 'bus-dep-1',
        title: 'Route 1',
        name: 'Thiruvarur → Kovilvenni → Thanjavur → Trichy',
        stops: ['Thiruvarur', 'Kovilvenni', 'Thanjavur', 'Trichy'],
        highlight: 'Kovilvenni',
        note: 'Board return buses directly from Kovilvenni College Bus Stop toward Thanjavur and Trichy.'
      },
      {
        id: 'bus-dep-2',
        title: 'Route 2',
        name: 'Kovilvenni → Thiruvarur or Nagapattinam',
        stops: ['Kovilvenni', 'Thiruvarur or Nagapattinam'],
        highlight: 'Kovilvenni',
        note: 'Frequent return buses toward Thiruvarur, Nagapattinam, and Velankanni available at the college main gate bus stop.'
      }
    ]
  }
};

export default function HowToReach() {
  const [activeTab, setActiveTab] = useState('arrival'); // 'arrival' | 'departure'
  const currentData = TRANSIT_DATA[activeTab];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
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
          Train schedules and bus route options for getting to and from <strong className="text-slate-200">DATAVERSE 2026</strong> at Kovilvenni.
        </p>
      </div>

      {/* Quick Location Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Symposium Venue</span>
            <span className="text-xs font-bold text-white block mt-0.5">AAMEC Campus</span>
            <span className="text-[11px] text-slate-400 block">Kovilvenni, Tiruvarur Dt. - 614403</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">Railway Station</span>
            <span className="text-xs font-bold text-white block mt-0.5">Kovilvenni Railway Stop</span>
            <span className="text-[11px] text-slate-400 block">2-min walkable distance to campus</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">Highway Bus Stop</span>
            <span className="text-xs font-bold text-white block mt-0.5">Kovilvenni Bus Stop (NH-67)</span>
            <span className="text-[11px] text-slate-400 block">Direct drop at college entrance</span>
          </div>
        </div>
      </div>

      {/* Direction Toggle Selector (Solid Filled for Active, Outlined/Ghost for Inactive) */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('arrival')}
            className={`flex items-center space-x-2 px-6 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'arrival'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/30'
                : 'bg-transparent text-slate-400 hover:text-white border border-transparent hover:border-slate-700/60'
            }`}
          >
            <span>🌅 Coming to College</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departure')}
            className={`flex items-center space-x-2 px-6 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              activeTab === 'departure'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/30'
                : 'bg-transparent text-slate-400 hover:text-white border border-transparent hover:border-slate-700/60'
            }`}
          >
            <span>🌆 Going Home</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-10 animate-fadeIn">
        
        {/* ==================================================================
            TRAIN TRAVEL SUBSECTION (Connected Dot-Timeline)
            ================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Trains {activeTab === 'arrival' ? '(Morning Arrivals)' : '(Evening Return)'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {currentData.trains.map((train, tIdx) => (
              <div
                key={train.number || tIdx}
                className="glass-card rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all p-5 sm:p-6 space-y-5"
              >
                {/* Train Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                        <span className="font-mono text-blue-300 font-black">{train.number}</span> · {train.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        Train · {train.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connected Dot-Timeline */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-700">
                    {train.stops.map((stop, sIdx) => {
                      const isCollege = stop.isCollege;

                      return (
                        <div key={sIdx} className="relative">
                          {/* Dot */}
                          <div
                            className={`absolute -left-6 top-1 rounded-full border-2 flex items-center justify-center transition-all ${
                              isCollege
                                ? 'w-5 h-5 -left-[26px] bg-emerald-500 border-white shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-500/20'
                                : 'w-4 h-4 bg-blue-500 border-blue-300 shadow-sm'
                            }`}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${isCollege ? 'font-black text-emerald-300 text-base' : 'font-bold text-white'}`}>
                                {stop.station}
                              </span>
                              {isCollege && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ★ College
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-slate-400 font-medium font-mono">
                              {stop.action} <span className="font-bold text-slate-200">{stop.time}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional train note */}
                {train.note && (
                  <p className="text-xs text-slate-400 italic">
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
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Important Notice
                </h4>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                  {currentData.alert.text}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================
            BUS TRAVEL SUBSECTION (Connected Chips / Pills)
            ================================================================== */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Buses {activeTab === 'arrival' ? '(Inbound Routes)' : '(Outbound Routes)'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentData.buses.map((bus) => (
              <div
                key={bus.id}
                className="glass-card rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all p-5 sm:p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase bg-purple-500/15 border border-purple-500/30 text-purple-300">
                      {bus.title}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {bus.name}
                    </h3>
                  </div>

                  <span className="text-[11px] text-purple-300/80 font-bold self-start sm:self-auto">
                    Frequent Highway Service
                  </span>
                </div>

                {/* Connected Chips / Pills */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {bus.stops.map((stop, sIdx) => {
                      const isTarget = stop.includes('Kovilvenni') || stop === bus.highlight;
                      const isLast = sIdx === bus.stops.length - 1;

                      return (
                        <React.Fragment key={sIdx}>
                          <div
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                              isTarget
                                ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 border border-purple-500/60 text-purple-200 shadow-md shadow-purple-950/40 font-black'
                                : 'bg-slate-900 border border-slate-700 text-slate-200'
                            }`}
                          >
                            <span>{stop}</span>
                            {isTarget && <span className="text-purple-300 font-extrabold text-[10px]">📍 College</span>}
                          </div>

                          {!isLast && (
                            <ArrowRight className="w-4 h-4 text-purple-400/60 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Route Only Muted Note */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-purple-300/80 font-semibold italic flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Route only · no fixed timing</span>
                  </span>
                  <p className="text-xs text-slate-400">{bus.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================================================================
            LIVE DIRECTIONS & GOOGLE MAPS CARD
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

        {/* Bottom Disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400">
            ℹ️ <strong className="text-slate-300">Disclaimer:</strong> Timings are indicative and subject to change. Please verify with local transit authorities before travel.
          </p>
        </div>

      </div>
    </div>
  );
}
