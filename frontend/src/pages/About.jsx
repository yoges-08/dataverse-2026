import React from 'react';
import { Sparkles, Building2, MapPin, Award, ShieldCheck, Target, Users, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          About DATAVERSE 2026
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-white">Innovate • Inspire • Create</h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          DATAVERSE is the premier annual national-level symposium hosted by the Department of Artificial Intelligence and Data Science (AI & DS) at Anjalai Ammal Mahalingam Engineering College, Kovilvenni.
        </p>
      </div>

      {/* About DATAVERSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">The Vision of DATAVERSE</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Founded with the ambition of empowering student innovators, DATAVERSE brings together over 1,500+ engineering students from leading institutes across India. The symposium provides a dynamic platform for technical mastery, AI challenges, research paper presentations, creative communication, and cultural talent.
          </p>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>Fostering hands-on practical problem solving in Agentic AI & Cloud Computing.</span>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>Encouraging inter-college collaboration, networking, and industry exposure.</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-indigo-500/30">
          <img
            src="/campus1.webp"
            alt="AAMEC campus"
            loading="lazy"
            width="1280"
            height="720"
            className="w-full h-72 object-cover rounded-2xl"
          />
        </div>
      </div>

      {/* About College */}
      <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-8">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Anjalai Ammal Mahalingam Engineering College</h2>
            <p className="text-xs text-indigo-300">Kovilvenni, Tiruvarur District, Tamil Nadu</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Anjalai Ammal Mahalingam Engineering College (AAMEC) is a distinguished institution known for its commitment to technical education, ethical values, and research excellence. Located in Kovilvenni, the college offers undergraduate and postgraduate engineering programs equipped with advanced computing infrastructure and experienced faculty mentors.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center">
            <h3 className="text-3xl font-black text-indigo-400">25+</h3>
            <span className="text-xs text-slate-400 font-medium">Years of Excellence</span>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center">
            <h3 className="text-3xl font-black text-indigo-400">100%</h3>
            <span className="text-xs text-slate-400 font-medium">Placement Assistance</span>
          </div>
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center">
            <h3 className="text-3xl font-black text-indigo-400">1500+</h3>
            <span className="text-xs text-slate-400 font-medium">Expected Participants</span>
          </div>
        </div>
      </div>

    </div>
  );
}
