import React, { useState } from 'react';
import { MapPin, Mail, Phone, Send, CheckCircle2, Building } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          Get in Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Contact Conveners & Organizers</h1>
        <p className="text-sm text-slate-400">Have queries regarding registration, accommodation, or event rules? Reach out to us directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Contact Form */}
        <div className="glass-card p-8 rounded-3xl border border-indigo-500/20 space-y-6">
          <h3 className="text-2xl font-bold text-white">Send Us a Message</h3>

          {submitted && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you! Your message has been sent to the DATAVERSE organizing committee.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Event Registration Inquiry"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="How can we assist you?"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        </div>

        {/* Contact Info & Location Map */}
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-2xl font-bold text-white">Campus Information</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <Building className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Anjalai Ammal Mahalingam Engineering College</span>
                  <span className="text-slate-400">Kovilvenni, Tiruvarur District, Tamil Nadu - 614403</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Official Email</span>
                  <span className="text-slate-400">dataverse2026@aamec.edu.in</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Helpline Numbers</span>
                  <span className="text-slate-400">+91 98421 00123 / +91 97890 12345</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 h-64">
            <iframe
              title="AAMEC Map Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4231888915467!2d79.231944!3d10.783056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a554a73752e5a59%3A0x6b3f7bf9c8e19c0a!2sAnjalai%20Ammal%20Mahalingam%20Engineering%20College!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

      </div>

    </div>
  );
}
