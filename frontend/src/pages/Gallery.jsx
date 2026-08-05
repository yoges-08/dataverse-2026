import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Image, Filter, Sparkles, X } from 'lucide-react';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await API.get('/gallery');
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    }
  };

  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      <div className="text-center space-y-3">
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          DATAVERSE Memories & Moments
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Event Gallery</h1>
        <p className="text-sm text-slate-400">Highlights from inauguration, coding hackathons, technical sessions, and cultural stages.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
        {['All', 'Technical', 'Non-Technical', 'Inauguration', 'Cultural'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            onClick={() => setLightboxImg(item)}
            className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
          >
            <div className="relative h-60 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block">{item.category} • {item.year}</span>
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-4xl w-full glass-card rounded-2xl overflow-hidden border border-indigo-500/30 relative p-4">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={lightboxImg.imageUrl}
              alt={lightboxImg.title}
              className="w-full h-[60vh] object-contain rounded-xl bg-slate-950"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white">{lightboxImg.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{lightboxImg.description}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
