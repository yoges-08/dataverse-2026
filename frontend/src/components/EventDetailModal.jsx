import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { X, AlertCircle, FileText, Sparkles, Calendar, Clock, MapPin, User, Code, Check, CheckCircle2, Users } from 'lucide-react';
import API from '../services/api';

const formatDate = (d) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

const EVENT_STRUCTURES = {
  'Code Sprint': {
    header: 'Competition Format • 3 Rounds',
    headerBadge: 'Scramble • Reverse • Solve',
    tagline: '⚡ Think Smart. Code Fast. Score Big!',
    rounds: [
      {
        step: 1,
        title: 'ROUND 1 – CODE SCRAMBLING',
        badge: 'Language: C',
        description: 'Arrange the shuffled lines of C code in the correct sequence and complete the program.',
        badgeStyle: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
        numberStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
        cardBorder: 'border-slate-800 hover:border-cyan-500/30'
      },
      {
        step: 2,
        title: 'ROUND 2 – REVERSE CODING',
        badge: 'Any Language',
        description: 'Recreate the program from the given output using your preferred programming language.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'ROUND 3 – CODE PICK & SOLVE',
        badge: 'Any Language',
        description: 'Choose a coding problem and solve it using your preferred programming language to earn points.',
        badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        numberStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20',
        cardBorder: 'border-slate-800 hover:border-emerald-500/30'
      }
    ]
  },
  'Bug Hunt': {
    header: 'Competition Format • 3 Rounds',
    headerBadge: 'Find • Fix • Defeat',
    tagline: '⚡ Find Fast. Fix Smart. Win Big!',
    rounds: [
      {
        step: 1,
        title: 'ROUND 1 – BUG BASICS',
        badge: 'Syntax & Logic',
        description: 'Find and fix simple syntax and logical errors in the given code snippet.',
        badgeStyle: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        numberStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/20',
        cardBorder: 'border-slate-800 hover:border-amber-500/30'
      },
      {
        step: 2,
        title: 'ROUND 2 – BUG BREAKER',
        badge: 'Multiple Hidden Bugs',
        description: 'Hunt and fix multiple hidden bugs including syntax, logic & runtime errors. Each bug = Points.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'ROUND 3 – DEBUGGING BATTLE',
        badge: 'Pass Test Cases',
        description: 'Solve a complex program with interconnected bugs and pass all test cases within the time limit.',
        badgeStyle: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
        numberStyle: 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-rose-500/20',
        cardBorder: 'border-slate-800 hover:border-rose-500/30'
      }
    ]
  },
  'Agentic AI': {
    header: 'Competition Format • 3 Rounds',
    headerBadge: 'Prompting • Detective • Pressure',
    tagline: '⚡ Think Autonomous. Build Smart. Lead the AI Future!',
    rounds: [
      {
        step: 1,
        title: 'ROUND 1 – PROMPTING BATTLE',
        badge: 'Prompt Engineering',
        description: 'Test your prompt-engineering skills! Create effective and creative prompts to get the best possible output from AI within a limited time.',
        badgeStyle: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
        numberStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
        cardBorder: 'border-slate-800 hover:border-cyan-500/30'
      },
      {
        step: 2,
        title: 'ROUND 2 – AI DETECTIVE',
        badge: 'Reasoning & Analysis',
        description: 'Put your reasoning skills to the test! Analyze AI-generated information, identify clues, spot errors, and find the correct solution.',
        badgeStyle: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
        numberStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50 shadow-indigo-500/20',
        cardBorder: 'border-slate-800 hover:border-indigo-500/30'
      },
      {
        step: 3,
        title: 'ROUND 3 – AGENT UNDER PRESSURE',
        badge: 'Real-Time Challenge',
        description: 'The ultimate challenge! Solve a real-time problem using AI while facing time limits and unexpected challenges. Think fast, adapt, and make the right decision.',
        badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        numberStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20',
        cardBorder: 'border-slate-800 hover:border-emerald-500/30'
      }
    ]
  },
  'Knowledge Knockout': {
    header: 'Competition Format • 3 Levels',
    headerBadge: '10 Mins / Level • Solo Event',
    tagline: '⚡ Test Your Mind. Beat the Clock. Knock Out the Rest!',
    rounds: [
      {
        step: 1,
        title: 'LEVEL 01 – TECHNICAL TOPICS',
        badge: '15 Questions',
        description: 'First level consists of 15 technical questions testing foundational and core concepts within 10 minutes.',
        badgeStyle: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
        numberStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
        cardBorder: 'border-slate-800 hover:border-cyan-500/30'
      },
      {
        step: 2,
        title: 'LEVEL 02 – RAPID FIRE',
        badge: '15 Questions',
        description: 'High-speed rapid-fire round with 15 questions testing mental agility, precision, and quick reflexes within 10 minutes.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'LEVEL 03 – BUZZER CHALLENGE',
        badge: '15 Questions',
        description: 'Final showdown buzzer challenge testing speed, accuracy, and presence of mind within 10 minutes.',
        badgeStyle: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        numberStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/20',
        cardBorder: 'border-slate-800 hover:border-amber-500/30'
      }
    ]
  },
  'NovaSpeak': {
    header: 'Presentation Stages & Flow',
    headerBadge: '15 Mins Duration',
    tagline: '⚡ Present with Clarity. Speak with Confidence. Inspire All!',
    rounds: [
      {
        step: 1,
        title: 'STAGE 1 – ABSTRACT SUBMISSION',
        badge: 'Prior to Event',
        description: 'Submit your presentation abstract or paper to novaspeak.aamec26@gmail.com after registering.',
        badgeStyle: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
        numberStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50 shadow-indigo-500/20',
        cardBorder: 'border-slate-800 hover:border-indigo-500/30'
      },
      {
        step: 2,
        title: 'STAGE 2 – ORAL PRESENTATION',
        badge: '15 Mins in English',
        description: 'Deliver your live technical presentation clearly, persuasively, and articulately in English.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'STAGE 3 – JURY Q&A & EVALUATION',
        badge: 'Expert Review',
        description: 'Defend your technical methodology, answer judges queries, and score points on depth and clarity.',
        badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        numberStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20',
        cardBorder: 'border-slate-800 hover:border-emerald-500/30'
      }
    ]
  },
  'Layman Vibes': {
    header: 'Competition Format • 3 Rounds',
    headerBadge: 'Non-Technical Event',
    tagline: '⚡ Smart Pick • Pixel Hunt • Sell As Well',
    rounds: [
      {
        step: 1,
        title: 'ROUND 1 – SMART PICK',
        badge: 'Observation & Guessing',
        description: 'A fun Truth or Lie challenge where participants test their observation, confidence, and guessing skills.',
        badgeStyle: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
        numberStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
        cardBorder: 'border-slate-800 hover:border-cyan-500/30'
      },
      {
        step: 2,
        title: 'ROUND 2 – PIXEL HUNT',
        badge: 'Photography Challenge',
        description: 'A creative Photography Challenge where participants capture the best shot based on the given theme/task.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'ROUND 3 – SELL AS WELL',
        badge: 'Ad-Mad / Selling',
        description: 'An entertaining Ad-Mad / Product Selling Challenge where participants creatively promote and sell a given object.',
        badgeStyle: 'text-pink-300 bg-pink-500/15 border-pink-500/30',
        numberStyle: 'bg-pink-500/20 text-pink-300 border-pink-400/50 shadow-pink-500/20',
        cardBorder: 'border-slate-800 hover:border-pink-500/30'
      }
    ]
  },
  "Lumina's Fest": {
    header: 'Event Format • 3 Games',
    headerBadge: 'Fun • Reflexes • Memory',
    tagline: '⚡ Just a Minute • Guess the Character • Memory Rush',
    rounds: [
      {
        step: 1,
        title: 'GAME 🎯 1: JUST A MIN 1️⃣',
        badge: '20 Cups Challenge',
        description: 'Catch the 20 cups with one hand and land the ball inside as many cups as possible within 1 minute.',
        badgeStyle: 'text-pink-300 bg-pink-500/15 border-pink-500/30',
        numberStyle: 'bg-pink-500/20 text-pink-300 border-pink-400/50 shadow-pink-500/20',
        cardBorder: 'border-slate-800 hover:border-pink-500/30'
      },
      {
        step: 2,
        title: 'GAME 🎯 2: GUESS THE CHARACTER 🎭',
        badge: 'Image Connect',
        description: 'Connect the images and guess the character within the time limit; locked answers cannot be changed.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'GAME 🎯 3: MEMORY RUSH 🏆',
        badge: 'Order & Recall',
        description: 'Observe the given images and arrange them in a order within the time limit.',
        badgeStyle: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        numberStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/20',
        cardBorder: 'border-slate-800 hover:border-amber-500/30'
      }
    ]
  },
  'Viral Vision': {
    header: 'Reel Creation & Submission Flow',
    headerBadge: 'Social Media',
    tagline: '⚡ Create Viral Content. Capture Hearts. Trending Now!',
    rounds: [
      {
        step: 1,
        title: 'STEP 1 – CHOOSE REEL TOPIC',
        badge: 'Select Theme',
        description: 'Pick an official symposium theme (Engineering Life, Degree vs Skills, Last Bench, etc.).',
        badgeStyle: 'text-pink-300 bg-pink-500/15 border-pink-500/30',
        numberStyle: 'bg-pink-500/20 text-pink-300 border-pink-400/50 shadow-pink-500/20',
        cardBorder: 'border-slate-800 hover:border-pink-500/30'
      },
      {
        step: 2,
        title: 'STEP 2 – SHOOT & EDIT REEL',
        badge: 'Originality',
        description: 'Create an engaging, high-quality, creative reel showcasing storytelling and editing.',
        badgeStyle: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        numberStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/20',
        cardBorder: 'border-slate-800 hover:border-purple-500/30'
      },
      {
        step: 3,
        title: 'STEP 3 – SUBMIT ON WHATSAPP',
        badge: '7845204654',
        description: 'Send your completed reel to 7845204654 with your Registration Code for jury grading.',
        badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        numberStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20',
        cardBorder: 'border-slate-800 hover:border-emerald-500/30'
      }
    ]
  }
};

const getEventStructure = (title) => {
  if (!title) return null;
  if (EVENT_STRUCTURES[title]) return EVENT_STRUCTURES[title];
  const lower = title.toLowerCase().trim();
  for (const key of Object.keys(EVENT_STRUCTURES)) {
    if (key.toLowerCase().trim() === lower) return EVENT_STRUCTURES[key];
  }
  if (lower.includes('layman')) return EVENT_STRUCTURES['Layman Vibes'];
  if (lower.includes('lumina')) return EVENT_STRUCTURES["Lumina's Fest"];
  if (lower.includes('agentic')) return EVENT_STRUCTURES['Agentic AI'];
  if (lower.includes('code sprint')) return EVENT_STRUCTURES['Code Sprint'];
  if (lower.includes('bug hunt')) return EVENT_STRUCTURES['Bug Hunt'];
  if (lower.includes('knowledge')) return EVENT_STRUCTURES['Knowledge Knockout'];
  if (lower.includes('nova')) return EVENT_STRUCTURES['NovaSpeak'];
  if (lower.includes('viral')) return EVENT_STRUCTURES['Viral Vision'];
  return null;
};

function EventRoundsTimeline({ rounds = [] }) {
  if (!rounds || rounds.length === 0) return null;
  return (
    <div className="relative pl-1 sm:pl-2">
      {rounds.map((round, idx) => {
        const isLast = idx === rounds.length - 1;
        return (
          <div key={round.step} className="relative flex items-start space-x-3 sm:space-x-4 pb-4 last:pb-0">
            {/* Connecting Vertical Track Line */}
            {!isLast && (
              <div
                className="absolute left-[13px] sm:left-[15px] top-7 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-800"
                aria-hidden="true"
              />
            )}

            {/* Step Number Badge */}
            <div className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 shadow-md ${round.numberStyle}`}>
              {round.step}
            </div>

            {/* Step Content Card */}
            <div className={`flex-1 p-3 bg-slate-950/75 rounded-xl border ${round.cardBorder} transition-all space-y-1.5 min-w-0`}>
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-xs font-black text-white tracking-wide">
                  {round.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${round.badgeStyle}`}>
                  {round.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {round.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EventDetailModal({ event, onClose, onRegisterSuccess }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [paperFile, setPaperFile] = useState(null);
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!event) return null;

  const maxParticipants = typeof event.maxParticipants === 'number' && event.maxParticipants > 0 ? event.maxParticipants : 0;
  const currentRegistrations = typeof event.currentRegistrations === 'number' ? event.currentRegistrations : 0;
  const seatsLeft = maxParticipants > 0 ? Math.max(0, maxParticipants - currentRegistrations) : null;
  const isFull = maxParticipants > 0 && currentRegistrations >= maxParticipants;
  const fillPercent = maxParticipants > 0 ? Math.min(100, Math.round((currentRegistrations / maxParticipants) * 100)) : 0;

  const handleRegister = async () => {
    if (isFull) {
      setMsg({ type: 'error', text: 'This event has reached its maximum participant capacity. Registration is closed.' });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/events', reason: 'register' } });
      return;
    }

    if (user.role !== 'student') {
      setMsg({ type: 'error', text: 'Only registered student accounts can register for symposium events.' });
      return;
    }

    if (event.pdfRequired && !paperFile) {
      setMsg({ type: 'error', text: 'Please select your paper presentation PDF file.' });
      return;
    }

    if (event.requiresLanguageChoice && !language) {
      setMsg({ type: 'error', text: 'Please select a programming language to register for this event.' });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });

      const formData = new FormData();
      if (paperFile) {
        formData.append('paperPdf', paperFile);
      }
      if (event.requiresLanguageChoice && language) {
        formData.append('language', language);
      }

      const res = await API.post(`/events/${event._id}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        if (onRegisterSuccess) onRegisterSuccess(event._id);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'))) {
        setMsg({
          type: 'error',
          text: 'The request timed out due to a slow connection. Your registration may have already gone through — please check your Student Dashboard ("My Events") before trying again.'
        });
      } else {
        setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to register for event.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
    >
      <div className="relative glass-card modal-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden">
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-30 min-w-[38px] min-h-[38px] p-2 rounded-full bg-slate-950/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          
          {/* Banner Header */}
          <div className="relative h-44 sm:h-52 w-full bg-slate-900 overflow-hidden shrink-0">
            <img
              src={event.bannerImage || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
              alt={event.title}
              loading="eager"
              className="w-full h-full object-cover object-center opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div className="absolute bottom-3 left-4 right-14 flex items-end justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  event.category === 'Technical'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                }`}>
                  {event.category} Event
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-1 leading-tight">{event.title}</h2>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-4 sm:p-6 space-y-5">

            {/* Top Notice Bar */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              event.teamLimit && event.teamLimit > 1
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
                {event.teamLimit && event.teamLimit > 1 ? (
                  <Users className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <User className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider block opacity-80">Top Notice</span>
                  <span className="text-xs font-bold text-white block">
                    {event.teamLimit && event.teamLimit > 1
                      ? `Team Event (Up to ${event.teamLimit} Members): After registering, add or join your classmates in the Team Management tab.`
                      : 'Solo Event: Individual performance (no teammates required).'}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 self-start sm:self-auto ${
                event.teamLimit && event.teamLimit > 1
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {event.teamLimit && event.teamLimit > 1 ? `Max ${event.teamLimit} Members` : 'Solo Only'}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>

            {/* Event Schedule & Venue Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Registration Fee</span>
                  <span className="text-xs font-bold text-emerald-200">100% Free • ₹0 Fee</span>
                </div>
              </div>

              {/* Event Capacity / Available Seats */}
              {maxParticipants > 0 && (
                <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 ${
                  isFull
                    ? 'bg-rose-950/40 border-rose-500/40'
                    : fillPercent >= 80
                    ? 'bg-amber-950/40 border-amber-500/30'
                    : 'bg-slate-900/70 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1.5">
                      <Users className={`w-3.5 h-3.5 ${isFull ? 'text-rose-400' : fillPercent >= 80 ? 'text-amber-400' : 'text-cyan-400'}`} />
                      <span>Event Capacity</span>
                    </span>
                    <span className={`text-xs font-black ${
                      isFull ? 'text-rose-400' : fillPercent >= 80 ? 'text-amber-300' : 'text-emerald-400'
                    }`}>
                      {isFull ? 'Event Full' : `${seatsLeft} seats left`}
                    </span>
                  </div>

                  {/* Slim Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFull
                          ? 'bg-rose-500'
                          : fillPercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.max(4, fillPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{currentRegistrations} registered</span>
                    <span>{maxParticipants} max</span>
                  </div>
                </div>
              )}
              {event.date && (
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Event Date</span>
                    <span className="text-xs font-bold text-white">{formatDate(event.date)}</span>
                  </div>
                </div>
              )}
              {event.time && (
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Event Time</span>
                    <span className="text-xs font-bold text-white">{event.time}</span>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Venue</span>
                    <span className="text-xs font-bold text-white">{event.venue}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Event Coordinator */}
            {(event.facultyCoordinator?.name || event.studentCoordinator?.name) && (
              <div className="p-3 bg-slate-900/70 rounded-xl border border-emerald-500/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Event Coordinator</span>
                </span>
                {event.facultyCoordinator?.name && (
                  <p className="text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">Faculty:</span> {event.facultyCoordinator.name}
                    {event.facultyCoordinator.phone ? ` • ${event.facultyCoordinator.phone}` : ''}
                  </p>
                )}
                {event.studentCoordinator?.name && (
                  <p className="text-xs text-slate-300">
                    <span className="text-cyan-400 font-bold">Student:</span> {event.studentCoordinator.name}
                    {event.studentCoordinator.phone ? ` • ${event.studentCoordinator.phone}` : ''}
                  </p>
                )}
              </div>
            )}

            {/* Registration limit notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-bold">Registration Limit:</span> Each student can register for a maximum of 4 events total (at most 2 Technical and 2 Non-Technical events).
              </span>
            </div>

            {/* Dynamic Event Rounds / Format Stepper Structure */}
            {(() => {
              const struct = getEventStructure(event.title);
              if (!struct) return null;
              return (
                <div className="p-4 sm:p-5 bg-slate-900/90 rounded-2xl border border-indigo-500/30 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{struct.header}</span>
                    </span>
                    {struct.headerBadge && (
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        {struct.headerBadge}
                      </span>
                    )}
                  </div>

                  {/* Connected Visual Timeline / Stepper */}
                  <EventRoundsTimeline rounds={struct.rounds} />

                  {struct.tagline && (
                    <div className="pt-1 text-center">
                      <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400">
                        {struct.tagline}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rules */}
            {event.rules && event.rules.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Event Rules & Guidelines</h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {event.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* NovaSpeak paper submission notice */}
            {event.title === 'NovaSpeak' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold">Paper Submission:</span> After registering, send your paper presentation to{' '}
                  <a href="mailto:novaspeak.aamec26@gmail.com" className="font-bold underline hover:text-rose-200">novaspeak.aamec26@gmail.com</a>
                </span>
              </div>
            )}

            {/* Viral Vision reel submission notice */}
            {event.title === 'Viral Vision' && (
              <>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-bold">Reel Submission:</span> After registering, send your reels to this number{' '}
                    <a href="tel:7845204654" className="font-bold underline hover:text-rose-200">7845204654</a>{' '}
                    or{' '}
                    <a href="https://wa.me/qr/R7CRFQEORARMK1" target="_blank" rel="noreferrer" className="font-bold underline hover:text-rose-200">WhatsApp</a>
                  </span>
                </div>

                {/* Viral Vision topics */}
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs text-pink-200">
                  <span className="font-bold text-pink-300 flex items-center space-x-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Reel Topics</span>
                  </span>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Engineering Student Life</li>
                    <li>Our Last College Bell</li>
                    <li>A World Without Phones</li>
                    <li>The Unseen Side of Success</li>
                    <li>The Lesson Beyond the Textbooks</li>
                    <li>Degree vs. Skills</li>
                    <li>The Last Bench vs. The First Bench</li>
                  </ul>
                </div>
              </>
            )}

            {/* Programming Language Selection (for Bug Hunt / language-enabled events) */}
            {event.requiresLanguageChoice && (
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Choose Programming Language <span className="text-rose-400">*</span></span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select the programming language you will use to identify and debug code during the competition.
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Python', 'C', 'C++'].map((langOption) => (
                    <button
                      key={langOption}
                      type="button"
                      onClick={() => {
                        setLanguage(langOption);
                        if (msg.type === 'error') setMsg({ type: '', text: '' });
                      }}
                      className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border flex flex-col items-center justify-center space-y-1 ${
                        language === langOption
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{langOption}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold ${
                        language === langOption ? 'text-indigo-200' : 'text-slate-500'
                      }`}>
                        {language === langOption ? '✓ Selected' : 'Choose'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Upload for Paper Presentation */}
            {event.pdfRequired && (
              <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-2">
                <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Upload Paper Presentation Abstract (.pdf mandatory)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPaperFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
              </div>
            )}

          </div>
        </div>

        {/* Sticky Register Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur shrink-0 space-y-3">
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}
          <button
            onClick={handleRegister}
            disabled={loading || isFull}
            className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-xl transition-[opacity,transform,background-color] duration-200 flex items-center justify-center space-x-2 ${
              isFull
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50'
            }`}
          >
            {isFull ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Event Full — Registration Closed</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Processing Registration...' : 'Register For Event'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
