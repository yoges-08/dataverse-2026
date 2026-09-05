import React, { useState, useEffect, useRef } from 'react';
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
  User,
  Loader,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Salad,
  Users
} from 'lucide-react';
import API from '../services/api';
import { formatEventWithEmoji } from '../utils/eventEmoji';

const STAR_LABELS = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Outstanding'
};

export default function Feedback() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');

  const [step1Verified, setStep1Verified] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // General Symposium Experience Ratings
  const [overallRating, setOverallRating] = useState({ rating: 0, comment: '' });
  const [hoveredOverall, setHoveredOverall] = useState(0);

  const [foodRating, setFoodRating] = useState({ rating: 0, comment: '' });
  const [hoveredFood, setHoveredFood] = useState(0);

  const [volunteersRating, setVolunteersRating] = useState({ rating: 0, comment: '' });
  const [hoveredVolunteers, setHoveredVolunteers] = useState(0);

  // Map of eventId -> { rating: number (1-5), comment: string }
  const [ratings, setRatings] = useState({});
  const [hoveredStars, setHoveredStars] = useState({}); // eventId -> starIndex (1-5)

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const step2Ref = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEvents();
  }, []);

  // When switching to Success or Already Submitted screen, ensure page scrolls to top
  useEffect(() => {
    if (submittedSuccess || alreadySubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submittedSuccess, alreadySubmitted]);

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

  // ----------------------------------------------------
  // Early Duplicate Check by Email (Step 1 -> Step 2 transition)
  // ----------------------------------------------------
  const handleProceedToRatings = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setDuplicateMessage('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!collegeName.trim()) {
      setErrorMsg('Please enter your college name.');
      return;
    }

    try {
      setCheckingDuplicate(true);
      const res = await API.get('/feedback/check', {
        params: {
          email: email.trim()
        }
      });

      if (res.data.alreadySubmitted) {
        const msg = res.data.message || "You've already submitted feedback with this email.";
        setDuplicateMessage(msg);
        setAlreadySubmitted(true);
        setStep1Verified(false);
        return;
      }

      // Pre-check passed! Proceed to Step 2
      setStep1Verified(true);
    } catch (err) {
      console.error('Error checking duplicate feedback:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to verify submission status. Please try again.');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleStarClick = (eventId, starValue) => {
    setRatings(prev => {
      const current = prev[eventId]?.rating;
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

  const eventRatedCount = Object.values(ratings).filter(r => r.rating >= 1 && r.rating <= 5).length;
  const generalRatedCount = (overallRating.rating > 0 ? 1 : 0) + (foodRating.rating > 0 ? 1 : 0) + (volunteersRating.rating > 0 ? 1 : 0);
  const totalRatedCount = eventRatedCount + generalRatedCount;

  // ----------------------------------------------------
  // Final Form Submission
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!step1Verified) {
      await handleProceedToRatings();
      return;
    }

    if (totalRatedCount === 0) {
      setErrorMsg('Please provide at least one rating (Overall Symposium, Food, Volunteers, or an Event) before submitting.');
      return;
    }

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
        name: name.trim(),
        email: email.trim(),
        collegeName: collegeName.trim(),
        foodRating: foodRating.rating > 0 ? foodRating : { rating: null, comment: '' },
        volunteersRating: volunteersRating.rating > 0 ? volunteersRating : { rating: null, comment: '' },
        overallRating: overallRating.rating > 0 ? overallRating : { rating: null, comment: '' },
        eventRatings: eventRatingsPayload
      });

      if (res.data.success) {
        setSubmittedSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      if (msg.toLowerCase().includes('already submitted')) {
        setDuplicateMessage(msg);
        setAlreadySubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
              Feedback Recorded
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Thank You, {name}!</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-2">
              Your valuable feedback has been recorded and will help our team enhance future editions of DATAVERSE.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto text-left space-y-1">
            <p><strong>Participant:</strong> <span className="text-white">{name}</span></p>
            <p><strong>Email:</strong> <span className="text-indigo-300 font-mono">{email}</span></p>
            <p><strong>College:</strong> <span className="text-slate-200">{collegeName}</span></p>
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
  // Screen: Already Submitted State (Early or Post-Submit)
  // ----------------------------------------------------
  if (alreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="glass-card p-10 sm:p-14 rounded-3xl border border-amber-500/40 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Duplicate Feedback Blocked
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Feedback Already Submitted</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed pt-2">
              {duplicateMessage || "You've already submitted feedback for this email. Thank you!"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto">
            <p>Email: <strong className="text-indigo-300 font-mono">{email || '—'}</strong></p>
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
                setDuplicateMessage('');
                setStep1Verified(false);
                setEmail('');
                setRatings({});
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Another Email</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Main Form Flow (3 Fields in Step 1)
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
          Open to all attendees and visitors! Provide your details below, then rate the symposium events you attended.
        </p>
      </div>

      {/* Global Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2.5 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Participant Information Card (3 Fields: Name, Email, College) */}
      <div className={`glass-card p-6 sm:p-8 rounded-3xl border transition-all space-y-5 ${
        step1Verified ? 'border-emerald-500/30 bg-slate-900/50' : 'border-indigo-500/25'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              step1Verified
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
            }`}>
              {step1Verified ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>1. Participant Information</span>
                {step1Verified && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    Verified
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">All three fields are required before rating events.</p>
            </div>
          </div>

          {step1Verified && (
            <button
              type="button"
              onClick={() => setStep1Verified(false)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
            >
              Edit Info
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Full Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={step1Verified}
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                disabled={step1Verified}
                placeholder="e.g. participant@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* College Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              College / Institution <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={step1Verified}
                placeholder="e.g. AAMEC Kovilvenni"
                value={collegeName}
                onChange={(e) => {
                  setCollegeName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Proceed to Step 2 Button (When Step 1 not yet completed) */}
        {!step1Verified && (
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToRatings}
              disabled={checkingDuplicate}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {checkingDuplicate ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Checking Eligibility...</span>
                </>
              ) : (
                <>
                  <span>Continue to Event Ratings</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* STEP 2: Rating Section (Revealed only after Step 1 is verified) */}
      {step1Verified && (
        <form onSubmit={handleSubmit} ref={step2Ref} className="space-y-8 animate-fadeIn">
          
          {/* SECTION 2A: Overall Experience & Facilities */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>2. Rate Symposium Experience &amp; Facilities</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share your overall experience with the symposium, pure veg catering, and volunteer hospitality.
                </p>
              </div>
              <div className="self-start sm:self-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  generalRatedCount > 0
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  {generalRatedCount}/3 facilities rated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* 1. Overall Symposium Experience */}
              <div className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all ${
                overallRating.rating > 0
                  ? 'border-indigo-500/40 bg-slate-900/60 shadow-lg shadow-indigo-950/20'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-indigo-500/15 border-indigo-500/30 text-indigo-300">
                        General
                      </span>
                      {overallRating.rating > 0 && (
                        <span className="text-[11px] font-bold text-indigo-300">
                          • Rated {overallRating.rating}/5
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                      <span>🌟 Overall Symposium Experience</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      How was your overall impression of DATAVERSE 2026 organization, ambiance, and schedule?
                    </p>
                  </div>

                  {/* Star selector */}
                  <div className="flex flex-col items-start sm:items-end space-y-1.5 shrink-0">
                    <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const activeVal = hoveredOverall || overallRating.rating;
                        const isFilled = starNum <= activeVal;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setOverallRating(prev => ({
                              ...prev,
                              rating: prev.rating === starNum ? 0 : starNum
                            }))}
                            onMouseEnter={() => setHoveredOverall(starNum)}
                            onMouseLeave={() => setHoveredOverall(0)}
                            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                            title={`${starNum} Star${starNum > 1 ? 's' : ''} - ${STAR_LABELS[starNum]}`}
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
                    <div className="flex items-center space-x-2 text-xs">
                      {(hoveredOverall || overallRating.rating) > 0 ? (
                        <span className="text-amber-300 font-bold text-[11px]">
                          {STAR_LABELS[hoveredOverall || overallRating.rating]}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Tap stars to rate</span>
                      )}
                      {overallRating.rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setOverallRating({ rating: 0, comment: '' })}
                          className="text-[10px] text-slate-400 hover:text-red-400 underline font-semibold transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {overallRating.rating > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-indigo-400" />
                      <span>Overall Comments &amp; Suggestions (Optional):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Well organized event, engaging speakers, memorable experience..."
                      value={overallRating.comment}
                      onChange={(e) => setOverallRating(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* 2. Food & Catering (Pure Veg) */}
              <div className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all ${
                foodRating.rating > 0
                  ? 'border-emerald-500/40 bg-slate-900/60 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                        Catering
                      </span>
                      {foodRating.rating > 0 && (
                        <span className="text-[11px] font-bold text-emerald-300">
                          • Rated {foodRating.rating}/5
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                      <Salad className="w-5 h-5 text-emerald-400" />
                      <span>🍲 Food &amp; Refreshments (Pure Veg Lunch)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      How was the quality, taste, hygiene, and distribution of lunch &amp; refreshments?
                    </p>
                  </div>

                  {/* Star selector */}
                  <div className="flex flex-col items-start sm:items-end space-y-1.5 shrink-0">
                    <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const activeVal = hoveredFood || foodRating.rating;
                        const isFilled = starNum <= activeVal;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setFoodRating(prev => ({
                              ...prev,
                              rating: prev.rating === starNum ? 0 : starNum
                            }))}
                            onMouseEnter={() => setHoveredFood(starNum)}
                            onMouseLeave={() => setHoveredFood(0)}
                            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                            title={`${starNum} Star${starNum > 1 ? 's' : ''} - ${STAR_LABELS[starNum]}`}
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
                    <div className="flex items-center space-x-2 text-xs">
                      {(hoveredFood || foodRating.rating) > 0 ? (
                        <span className="text-amber-300 font-bold text-[11px]">
                          {STAR_LABELS[hoveredFood || foodRating.rating]}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Tap stars to rate</span>
                      )}
                      {foodRating.rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setFoodRating({ rating: 0, comment: '' })}
                          className="text-[10px] text-slate-400 hover:text-red-400 underline font-semibold transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {foodRating.rating > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span>Food Comments &amp; Suggestions (Optional):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delicious lunch, timely distribution, good variety..."
                      value={foodRating.comment}
                      onChange={(e) => setFoodRating(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* 3. Volunteers & Support */}
              <div className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all ${
                volunteersRating.rating > 0
                  ? 'border-blue-500/40 bg-slate-900/60 shadow-lg shadow-blue-950/20'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-blue-500/15 border-blue-500/30 text-blue-300">
                        Hospitality
                      </span>
                      {volunteersRating.rating > 0 && (
                        <span className="text-[11px] font-bold text-blue-300">
                          • Rated {volunteersRating.rating}/5
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span>🤝 Volunteers &amp; Event Coordination</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      How helpful, polite, and well-organized were our student coordinators &amp; volunteers?
                    </p>
                  </div>

                  {/* Star selector */}
                  <div className="flex flex-col items-start sm:items-end space-y-1.5 shrink-0">
                    <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const activeVal = hoveredVolunteers || volunteersRating.rating;
                        const isFilled = starNum <= activeVal;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setVolunteersRating(prev => ({
                              ...prev,
                              rating: prev.rating === starNum ? 0 : starNum
                            }))}
                            onMouseEnter={() => setHoveredVolunteers(starNum)}
                            onMouseLeave={() => setHoveredVolunteers(0)}
                            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                            title={`${starNum} Star${starNum > 1 ? 's' : ''} - ${STAR_LABELS[starNum]}`}
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
                    <div className="flex items-center space-x-2 text-xs">
                      {(hoveredVolunteers || volunteersRating.rating) > 0 ? (
                        <span className="text-amber-300 font-bold text-[11px]">
                          {STAR_LABELS[hoveredVolunteers || volunteersRating.rating]}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Tap stars to rate</span>
                      )}
                      {volunteersRating.rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setVolunteersRating({ rating: 0, comment: '' })}
                          className="text-[10px] text-slate-400 hover:text-red-400 underline font-semibold transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {volunteersRating.rating > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-blue-400" />
                      <span>Volunteers Comments &amp; Suggestions (Optional):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extremely helpful volunteers, prompt guidance across venues..."
                      value={volunteersRating.comment}
                      onChange={(e) => setVolunteersRating(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2B: Rate Events Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>3. Rate Specific Competitions &amp; Events</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rate the technical or non-technical competitions you attended or participated in.
                </p>
              </div>
              <div className="self-start sm:self-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  eventRatedCount > 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  {eventRatedCount} {eventRatedCount === 1 ? 'event' : 'events'} rated
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

                          <h3 className="text-base sm:text-lg font-black text-white leading-tight flex items-center space-x-2">
                            <span>{formatEventWithEmoji(ev.title)}</span>
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

                      {/* Optional Comment Input */}
                      {currentRating > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3 text-indigo-400" />
                            <span>Comments / Suggestions for {ev.title} (Optional):</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Challenging questions, great coordination, smooth timing..."
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
                {totalRatedCount > 0 ? (
                  <span className="text-emerald-400 font-semibold">
                    ✓ {totalRatedCount} {totalRatedCount === 1 ? 'rating' : 'ratings'} provided by {name}
                  </span>
                ) : (
                  <span className="text-amber-400">
                    Select stars on at least one section above before submitting.
                  </span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || totalRatedCount === 0}
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
      )}

    </div>
  );
}
