import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Trophy, Users, User, Zap, ChevronRight, Sparkles, Code
} from 'lucide-react';

export default function EventCard({ event, onSelect }) {
  if (!event) return null;

  const isTech = event.category === 'Technical';
  const isTeam = event.teamLimit && event.teamLimit > 1;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative group rounded-3xl overflow-hidden glass-card border flex flex-col h-full transition-all duration-300 ${
        isTech
          ? 'border-slate-800/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/15'
          : 'border-slate-800/80 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-600/15'
      }`}
    >
      {/* Glow overlay effect on hover */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-b ${
          isTech 
            ? 'from-indigo-600/5 via-transparent to-purple-600/10' 
            : 'from-pink-600/5 via-transparent to-purple-600/10'
        }`} 
      />

      {/* Banner Image Container */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-950 shrink-0">
        <img
          src={event.bannerImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Badges Overlay */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none gap-2">
          {/* Category Pill */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center space-x-1.5 ${
              isTech
                ? 'bg-indigo-600/80 border-indigo-400/40 text-white shadow-indigo-950/50'
                : 'bg-gradient-to-r from-pink-600/80 to-rose-600/80 border-pink-400/40 text-white shadow-pink-950/50'
            }`}
          >
            {isTech ? <Code className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            <span>{event.category}</span>
          </span>

          {/* Team / Solo Pill */}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md bg-slate-950/80 border border-slate-700/60 text-slate-200 flex items-center space-x-1 shadow-md">
            {isTeam ? (
              <>
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Team ({event.teamLimit})</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-amber-400" />
                <span>Solo</span>
              </>
            )}
          </span>
        </div>

        {/* Prize Pill (if first prize exists) */}
        {event.prizes?.first && (
          <div className="absolute bottom-3 left-3.5 right-3.5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 shadow-md">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Prize: {event.prizes.first.split('+')[0] || event.prizes.first}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight leading-tight">
            {event.title}
          </h3>

          {/* Tagline */}
          {event.tagline && (
            <p className="text-xs font-bold text-indigo-300 line-clamp-1">
              {event.tagline}
            </p>
          )}

          {/* Description */}
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-3 pt-0.5">
            {event.description}
          </p>

          {/* Metadata Badges (Date & Venue) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-medium text-slate-300">
            {event.date && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{event.date.split('-').reverse().join('/')}</span>
              </span>
            )}
            {event.venue && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="truncate max-w-[140px]">{event.venue}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Button / CTA */}
        <div className="pt-3 border-t border-slate-800/80">
          {onSelect ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(event)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center space-x-2 group/btn"
            >
              <Zap className="w-4 h-4 text-amber-300 shrink-0 group-hover/btn:scale-110 transition-transform" />
              <span>View Rules & Register</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <Link
              to="/events"
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-between group/link"
            >
              <span className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explore Competition</span>
              </span>
              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
