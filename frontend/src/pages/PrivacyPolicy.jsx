import React from 'react';
import { ShieldCheck, FileText, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-indigo-500/30 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>DATAVERSE 2026 collects personal information provided by participants during registration, including full name, email address, mobile number, date of birth, gender, college name, department, year of study, emergency contact number, and event registrations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
            <p>Your information is used solely to process symposium registrations, generate participant ID badges, QR check-in passes, e-certificates, communicate event updates, and manage on-site attendance. We do not sell or share your personal data with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Data Security</h2>
            <p>Your password is stored using strong cryptographic hashing (bcrypt). All traffic to the portal is transmitted over HTTPS. Access to registration and check-in data is restricted to authorized event coordinators and volunteers only.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Data Retention</h2>
            <p>Participant records and e-certificates are retained for the duration of the symposium and a reasonable period afterward for certificate verification and institutional record keeping.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting the organizing committee. Certificate records may be retained for verification purposes even after a deletion request.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Contact Us</h2>
            <p className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>For privacy inquiries, email <span className="text-indigo-300 font-semibold">dataverse2026@aamec.edu.in</span></span>
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
          <Link to="/register" className="text-indigo-400 font-bold hover:underline">Back to Registration</Link>
          <Link to="/terms" className="text-indigo-400 font-bold hover:underline">Read Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
