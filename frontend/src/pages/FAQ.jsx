import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    { q: "Is there any registration fee for DATAVERSE 2026?", a: "No! Registration is completely free (₹0 Fee) for all technical competitions, quizzes, paper presentations, creative non-technical events, food, and certificates. There is no registration fee required." },
    { q: "Who can register for DATAVERSE 2026?", a: "DATAVERSE is open to only for engineering students (B.E/B.Tech) students from any recognized institute across India." },
    { q: "Is on-spot registration available for non-registered students?", a: "Yes! While online pre-registration is recommended to reserve event seats, spot registration counters will be open at Main Block Admin Reception on Day 1 starting 9:30 AM." },
    { q: "How do I get my entry ticket and QR code?", a: "Once your online registration is approved by the admin team, your unique Symposium Code (e.g. DV2026-REG-1001) and QR Code ticket will appear on your Student Dashboard and downloadable receipt." },
    { q: "Are certificates provided to all participants?", a: "Yes! High-resolution verified E-Certificates will be issued to all verified participants and winners after check-in and event completion." },
    { q: "Is accommodation and food available?", a: "Yes, food (Veg/Non-Veg options) is included with registration. Hostel accommodation is available upon selection during registration." }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      <div className="text-center space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          Got Questions?
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-400">Everything you need to know about DATAVERSE registration, events, and venue rules.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
              className="w-full p-5 text-left font-bold text-white flex items-center justify-between space-x-4 hover:text-indigo-400 transition-colors"
            >
              <span className="text-base">{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-indigo-400 shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>

            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 border-t border-slate-800/50 pt-3 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
