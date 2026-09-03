import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Building,
  Mail,
  Loader,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import API from '../services/api';

const STAR_LABELS = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Outstanding'
};

export default function Feedback() {
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Map of eventId -> { rating: number (1-5), comment: string }
  const [ratings, setRatings] = useState({});
  const [hoveredStars, setHoveredStars] = useState({}); // eventId -> starIndex (1-5)

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await API.get('/events');
      if (res.data.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error fetching events for feedback:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleStarClick = (eventId, starValue) => {
    setRatings(prev => {
      const current = prev[eventId]?.rating;
      // If clicking the same star, clear the rating
      if (current === starValue) {
        const next = { ...prev };
        delete next[eventId];
        return next;
      }
      return {
        ...prev,
        [eventId]: {
          rating: starValue,
          comment: prev[eventId]?.comment || ''
        }
      };
    });
    setErrorMsg('');
  };

  const handleCommentChange = (eventId, comment) => {
    setRatings(prev => ({
      ...prev,
      [eventId]: {
        rating: prev[eventId]?.rating || 0,
        comment
      }
    }));
  };

  const handleClearRating = (eventId) => {
    setRatings(prev => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  };

  const ratedCount = Object.values(ratings).filter(r => r.rating >= 1 && r.rating <= 5).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!collegeName.trim()) {
      setErrorMsg('Please enter your college name.');
      return;
    }

    if (ratedCount === 0) {
      setErrorMsg('Please rate at least one event (1 to 5 stars) before submitting.');
      return;
    }

    // Build payload
    const eventRatingsPayload = Object.entries(ratings)
      .filter(([, data]) => data.rating >= 1 && data.rating <= 5)
      .map(([eventId, data]) => {
        const targetEvent = events.find(ev => (ev._id || ev.id) === eventId);
        return {
          event: eventId,
          eventTitle: targetEvent?.title || 'Symposium Event',
          rating: data.rating,
          comment: data.comment || ''
        };
      });

    try {
      setSubmitting(true);
      const res = await API.post('/feedback', {
        email: email.trim(),
        collegeName: collegeName.trim(),
        eventRatings: eventRatingsPayload
      });

      if (res.data.success) {
        setSubmittedSuccess(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      if (msg.toLowerCase().includes('already submitted')) {
        setAlreadySubmitted(true);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Screen: Success State
  // ----------------------------------------------------
  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="glass-card p-10 sm:p-14 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Feedback Received
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Thank You for Your Feedback!</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-2">
              Your feedback helps our student coordinators and the Department of Artificial Intelligence & Data Science at AAMEC deliver even better symposium experiences.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto">
            <p>Submitted under: <strong className="text-indigo-300 font-mono">{email}</strong></p>
            <p className="mt-1">Institution: <strong className="text-white">{collegeName}</strong></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all"
            >
              Return to Homepage
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
            >
              View Events Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Screen: Already Submitted State
  // ----------------------------------------------------
  if (alreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="glass-card p-10 sm:p-14 rounded-3xl border border-amber-500/40 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Already Submitted
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Feedback Already Recorded</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-2">
              Our records show that feedback for <strong className="text-indigo-300 font-mono">{email}</strong> has already been submitted. To keep ratings authentic, each participant can only submit feedback once.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30"
            >
              Back to Home
            </Link>
            <button
              onClick={() => {
                setAlreadySubmitted(false);
                setEmail('');
                setCollegeName('');
                setRatings({});
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Use a Different Email</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Main Form Flow
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DATAVERSE 2026 Feedback</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Event Ratings & Experience Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Open to all attendees and visitors! Rate the symposium events you participated in or attended, and share your suggestions with the organizing team.
        </p>
      </div>

      {/* Global Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2.5 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Participant Details Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/25 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">1. Your Identification</h2>
              <p className="text-xs text-slate-400">One feedback submission per email address.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1 text-xs">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. participant@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 text-xs">
                College / Institution Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. AAMEC Kovilvenni"
                  value={collegeName}
                  onChange={(e) => {
                    setCollegeName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Rate Events Card */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>2. Rate Symposium Events</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rate only the events you participated in or attended (at least 1 required). Comments are optional.
              </p>
            </div>
            <div className="self-start sm:self-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                ratedCount > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}>
                {ratedCount} {ratedCount === 1 ? 'event' : 'events'} rated
              </span>
            </div>
          </div>

          {loadingEvents ? (
            <div className="glass-card p-12 rounded-2xl text-center space-y-3">
              <Loader className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-slate-400">Loading symposium events catalog...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-400">
              No events found. Please try refreshing.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((ev) => {
                const eventId = ev._id || ev.id;
                const currentRating = ratings[eventId]?.rating || 0;
                const currentHover = hoveredStars[eventId] || 0;
                const activeStarValue = currentHover || currentRating;
                const currentComment = ratings[eventId]?.comment || '';

                return (
                  <div
                    key={eventId}
                    className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all ${
                      currentRating > 0
                        ? 'border-amber-500/40 bg-slate-900/60 shadow-lg shadow-amber-950/20'
                        : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Event Info */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            ev.category === 'Technical'
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                              : 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                          }`}>
                            {ev.category}
                          </span>
                          {currentRating > 0 && (
                            <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
                              <span>• Rated {currentRating}/5</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                          {ev.title}
                        </h3>
                        {ev.tagline && (
                          <p className="text-xs text-slate-400 line-clamp-2">{ev.tagline}</p>
                        )}
                      </div>

                      {/* Interactive 5-Star Rating Selector */}
                      <div className="flex flex-col items-start sm:items-end space-y-1.5 shrink-0">
                        <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                          {[1, 2, 3, 4, 5].map((starNum) => {
                            const isFilled = starNum <= activeStarValue;
                            return (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => handleStarClick(eventId, starNum)}
                                onMouseEnter={() => setHoveredStars(prev => ({ ...prev, [eventId]: starNum }))}
                                onMouseLeave={() => setHoveredStars(prev => ({ ...prev, [eventId]: 0 }))}
                                className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                                title={`${starNum} Star${starNum > 1 ? 's' : ''} - ${STAR_LABELS[starNum]}`}
                                aria-label={`Rate ${starNum} out of 5 stars for ${ev.title}`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    isFilled
                                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                      : 'text-slate-600 hover:text-slate-400'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Star Rating Label & Clear Button */}
                        <div className="flex items-center space-x-2 text-xs">
                          {activeStarValue > 0 ? (
                            <span className="text-amber-300 font-bold text-[11px]">
                              {STAR_LABELS[activeStarValue]}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Tap stars to rate</span>
                          )}

                          {currentRating > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearRating(eventId)}
                              className="text-[10px] text-slate-400 hover:text-red-400 underline font-semibold transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Optional Comment Input (Shown once student rates the event) */}
                    {currentRating > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3 text-indigo-400" />
                          <span>Comments / Suggestions for {ev.title} (Optional):</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Well organized, questions were challenging, great pacing..."
                          value={currentComment}
                          onChange={(e) => handleCommentChange(eventId, e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors"
                        />
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white block">Ready to submit?</span>
            <span>
              {ratedCount > 0 ? (
                <span className="text-emerald-400 font-semibold">
                  ✓ {ratedCount} {ratedCount === 1 ? 'event' : 'events'} rated
                </span>
              ) : (
                <span className="text-amber-400">
                  Select stars on at least one event above before submitting.
                </span>
              )}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || ratedCount === 0}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Recording Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Symposium Feedback</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
