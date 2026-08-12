import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate = '2026-09-12T09:00:00' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const timeBlocks = [
    { label: 'Days', value: timeLeft.days || 0 },
    { label: 'Hours', value: timeLeft.hours || 0 },
    { label: 'Minutes', value: timeLeft.minutes || 0 },
    { label: 'Seconds', value: timeLeft.seconds || 0 }
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-indigo-500/30 max-w-xl mx-auto shadow-2xl shadow-indigo-900/20">
      <div className="flex items-center justify-center space-x-2 text-indigo-400 mb-4">
        <Clock className="w-5 h-5 animate-pulse" />
        <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Symposium Grand Launch Countdown</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        {timeBlocks.map((block, idx) => (
          <div key={idx} className="bg-slate-900/90 rounded-xl p-2.5 sm:p-4 border border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {String(block.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase mt-1">
              {block.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
