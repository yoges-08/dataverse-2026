import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Mail, Phone, ExternalLink, Heart, Globe, Award, Shield } from 'lucide-react';

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
              <li><Link to="/schedule" className="hover:text-indigo-400 transition-colors">Symposium Timeline</Link></li>
              <li><Link to="/gallery" className="hover:text-indigo-400 transition-colors">Event Gallery</Link></li>
              <li><Link to="/sponsors" className="hover:text-indigo-400 transition-colors">Our Sponsors</Link></li>
              <li><Link to="/faq" className="hover:text-indigo-400 transition-colors">Frequently Asked Questions</Link></li>
            </ul>
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
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+91 4374 232 555 / 98421 00123</span>
              </div>
            </div>
          </div>

          {/* Col 4: Google Maps & Verification */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Campus Location</h4>
            <div className="rounded-xl overflow-hidden border border-slate-800 relative group">
              <iframe
                title="AAMEC Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4231888915467!2d79.231944!3d10.783056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a554a73752e5a59%3A0x6b3f7bf9c8e19c0a!2sAnjalai%20Ammal%20Mahalingam%20Engineering%20College!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="130"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                className="filter opacity-80 group-hover:opacity-100 transition-opacity"
              ></iframe>
            </div>
            <a
              href="https://maps.google.com/?q=Anjalai+Ammal+Mahalingam+Engineering+College+Kovilvenni"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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
