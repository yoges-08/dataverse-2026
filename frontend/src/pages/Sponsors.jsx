import React from 'react';
import { Award, Sparkles, Building, Globe } from 'lucide-react';

export default function Sponsors() {
  const sponsors = [
    { name: 'Google Cloud', tier: 'Title Partner', logo: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=400&q=80' },
    { name: 'GitHub Student Developer', tier: 'Tech Ecosystem Partner', logo: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=400&q=80' },
    { name: 'Red Bull E-Sports', tier: 'Energy & Gaming Partner', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80' },
    { name: 'HCL Technologies', tier: 'Placement & Innovation Partner', logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-center">
      
      <div className="space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          DATAVERSE Industry Network
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Our Valued Sponsors</h1>
        <p className="text-sm text-slate-400">Supported by leading technology corporations, innovation hubs, and campus recruitment leaders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {sponsors.map((sp, idx) => (
          <div key={idx} className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col items-center space-y-4">
            <img src={sp.logo} alt={sp.name} loading="lazy" className="w-24 h-24 rounded-2xl object-cover border border-slate-700" />
            <div>
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">{sp.tier}</span>
              <h3 className="text-xl font-extrabold text-white mt-1">{sp.name}</h3>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
