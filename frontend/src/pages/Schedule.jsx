import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Award } from 'lucide-react';

export default function Schedule() {
  const [activeDay, setActiveDay] = useState('Day1');

  const scheduleData = {
    Day1: [
      { time: '08:30 AM - 09:30 AM', title: 'Student Registration & QR Check-In', venue: 'Main Block Admin Reception', category: 'General' },
      { time: '09:30 AM - 10:30 AM', title: 'DATAVERSE 2026 Grand Inauguration', venue: 'Main College Auditorium', category: 'Inauguration' },
      { time: '10:30 AM - 12:30 PM', title: 'Quiz Prelims & Buzzer Round', venue: 'Auditorium Block A', category: 'Technical' },
      { time: '11:00 AM - 03:00 PM', title: 'Agentic AI Hackathon & Agent Demo', venue: 'CS Lab 3 & High Performance Computing Lab', category: 'Technical' },
      { time: '01:30 PM - 04:30 PM', title: 'Paper Presentation Sessions', venue: 'Seminar Hall B', category: 'Technical' }
    ],
    Day2: [
      { time: '09:30 AM - 10:30 AM', title: 'Day 2 Keynote: Future of Generative AI', venue: 'Auditorium Block A', category: 'Keynote' },
      { time: '10:00 AM - 12:30 PM', title: 'Layman Vibes Tech Explanation Challenge', venue: 'Open Air Theatre (OAT)', category: 'Non-Technical' },
      { time: '10:30 AM - 03:30 PM', title: 'Viral Vision Reel Screening & Submission', venue: 'A/C Conference Hall', category: 'Non-Technical' },
      { time: '01:30 PM - 03:30 PM', title: 'Luminas Fest Cultural Stage Performance', venue: 'Main Auditorium', category: 'Non-Technical' },
      { time: '03:45 PM - 05:00 PM', title: 'Valedictory Function & Trophy Distribution', venue: 'Main Auditorium', category: 'Valedictory' }
    ]
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      <div className="text-center space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          DATAVERSE 2026 Timeline
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Event Schedule</h1>
        <p className="text-sm text-slate-400">Plan your symposium itinerary across Day 1 and Day 2 competitions.</p>
      </div>

      {/* Day Selector */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { key: 'Day1', label: 'Day 1 • September 15, 2026' },
          { key: 'Day2', label: 'Day 2 • September 16, 2026' }
        ].map(d => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeDay === d.key
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-indigo-500/30">
        {scheduleData[activeDay].map((slot, idx) => (
          <div key={idx} className="relative pl-12 glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
            
            <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-indigo-600 border-4 border-slate-950 shadow-md"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {slot.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{slot.title}</h3>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">{slot.time}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{slot.venue}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
