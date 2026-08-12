import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Mail, Phone, Heart, Globe, Award, Shield, Instagram, Linkedin, Navigation } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: About DATAVERSE */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-wider">DATAVERSE</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              National Level Technical & Non-Technical Symposium organized by Anjalai Ammal Mahalingam Engineering College, Kovilvenni.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              Tagline: Innovate • Inspire • Create
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/events" className="hover:text-indigo-400 transition-colors">Technical Events</Link></li>
              <li><Link to="/events" className="hover:text-indigo-400 transition-colors">Non-Technical Events</Link></li>
              <li><Link to="/faq" className="hover:text-indigo-400 transition-colors">Frequently Asked Questions</Link></li>
            </ul>

            <div className="flex items-center space-x-3 mt-5">
              <a
                href="https://www.instagram.com/dataverse_26?igsh=djNwa2pqdng5cXo2"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow DATAVERSE on Instagram"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-gradient-to-tr hover:from-fuchsia-600 hover:to-amber-500 flex items-center justify-center text-slate-300 hover:text-white transition-all border border-slate-800"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/search/results/all/?keywords=DATAVERSE%20AAMEC"
                target="_blank"
                rel="noreferrer"
                aria-label="Find DATAVERSE on LinkedIn"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-sky-600 flex items-center justify-center text-slate-300 hover:text-white transition-all border border-slate-800"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 3: Contact Info & College */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Institution Details</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Anjalai Ammal Mahalingam Engineering College, Kovilvenni, Tiruvarur District, Tamil Nadu - 614403</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>dataverse2026@aamec.edu.in</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block"><span className="text-slate-300 font-semibold">Symposium Coordinator:</span> Dr. K. Jayanthi - 9994718221</span>
                  <span className="block mt-1"><span className="text-slate-300 font-semibold">Organizer Members:</span> 9791656236 / 8122310171 / 9489038346 / 8838999607</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Campus Location — interactive map */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Campus Location</h4>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg shadow-black/30">
              <iframe
                title="AAMEC Campus Location Map"
                src="https://www.google.com/maps?q=Anjalai%20Ammal%20Mahalingam%20Engineering%20College%2C%20Kovilvenni%2C%20Tamil%20Nadu&z=16&output=embed"
                className="w-full h-52"
                style={{ border: 0, filter: 'saturate(0.85)' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Anjalai+Ammal+Mahalingam+Engineering+College%2C+Kovilvenni%2C+Tamil+Nadu"
                target="_blank"
                rel="noreferrer"
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-indigo-600/95 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 transition-colors"
                title="Get directions to AAMEC on Google Maps"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs space-y-4 md:space-y-0">
          <p>© 2026 DATAVERSE - Anjalai Ammal Mahalingam Engineering College. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL Secured & Verified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>ISO 9001:2015 Certified</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
