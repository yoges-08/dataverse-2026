import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Sparkles, Menu, X, User, LogOut, LayoutDashboard, 
  Calendar, Info, Phone, Trophy, Award, ShieldCheck, Zap
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'super_admin': return '/dashboard/admin';
      case 'coordinator': return '/dashboard/coordinator';
      case 'volunteer': return '/dashboard/volunteer';
      default: return '/dashboard/student';
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="DATAVERSE Logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                className="w-full h-full object-contain p-0.5 bg-slate-900 rounded-[10px]"
              />
              <div className="hidden items-center justify-center w-full h-full bg-slate-900 rounded-[10px]">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-wider text-white">
                DATA<span className="gradient-text">VERSE</span>
              </span>
              <span className="text-[10px] block font-bold text-indigo-400 tracking-widest uppercase -mt-1">
                AAMEC 2026
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-8 text-xs font-bold text-slate-300">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/events" className="hover:text-indigo-400 transition-colors">Events</Link>
            <Link to="/schedule" className="hover:text-indigo-400 transition-colors">Schedule</Link>
            <Link to="/gallery" className="hover:text-indigo-400 transition-colors">Gallery</Link>
            <Link to="/sponsors" className="hover:text-indigo-400 transition-colors">Sponsors</Link>
            <Link to="/about" className="hover:text-indigo-400 transition-colors">About AAMEC</Link>
            <Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link>
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-xs font-bold">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-extrabold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-6 space-y-4 text-sm font-semibold">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Home</Link>
          <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Events</Link>
          <Link to="/schedule" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Schedule</Link>
          <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Gallery</Link>
          <Link to="/sponsors" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Sponsors</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">About AAMEC</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Contact</Link>
          
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {user ? (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Register Now
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center rounded-xl bg-slate-900 text-slate-200 font-bold"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
