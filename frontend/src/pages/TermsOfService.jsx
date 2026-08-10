import React from 'react';
import { FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-indigo-500/30 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By registering for DATAVERSE 2026, you agree to these Terms of Service. If you do not agree, please do not complete the registration process.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Eligibility</h2>
            <p>Participation is open to current undergraduate and postgraduate students of recognized engineering and science institutions. Participants must provide accurate and truthful registration information.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Registration & Event Rules</h2>
            <p>Each student may register for a maximum of 3 symposium events. Participants must follow the published rules for each event. Paper presentation submissions must be original work. The organizing committee reserves the right to disqualify any participant found violating event rules.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Code of Conduct</h2>
            <p>All participants must maintain professional conduct on campus. Any form of harassment, vandalism, or disruption of symposium proceedings may result in immediate disqualification and removal from the venue.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Certificates & Awards</h2>
            <p>E-certificates are issued to participants who complete their registered events. Certificate details are based on the information provided at registration. Winners are decided by the appointed event judges and their decisions are final.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Limitation of Liability</h2>
            <p className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Anjalai Ammal Mahalingam Engineering College and the DATAVERSE organizing committee are not liable for loss of personal belongings, travel delays, or medical incidents that occur outside the official symposium venue and program.</span>
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
          <Link to="/register" className="text-indigo-400 font-bold hover:underline">Back to Registration</Link>
          <Link to="/privacy-policy" className="text-indigo-400 font-bold hover:underline">Read Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
