import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import useMagneticHover from '../utils/useMagneticHover';
import { 
  Sparkles, Menu, X, User, LogOut, LayoutDashboard, 
  Calendar, Info, Phone, Trophy, Award, ShieldCheck, Zap
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const navRef = useRef(null);
  const navLinkRefs = useRef({});
  const registerMagnetic = useMagneticHover(0.2);
  const navigate = useNavigate();
  const location = useLocation();

  // Shrink the bar once the page is scrolled (Apple-style).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open, and close it on resize.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    const onResize = () => setMobileMenuOpen(false);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', onResize);
    };
  }, [mobileMenuOpen]);

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

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/events', label: 'Events', end: false },
    { to: '/about', label: 'About AAMEC', end: false },
    { to: '/contact', label: 'Contact', end: false },
  ];

  // Certificates/Team Management are only shown to logged-in students.
  const studentNavItems = user?.role === 'student'
    ? [...navItems, { to: '/certificates', label: 'Certificates', end: false }, { to: '/team-management', label: 'Team Management', end: false }]
    : navItems;

  const isActive = (item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  // Slide the underline indicator to the active link.
  useEffect(() => {
    const measure = () => {
      const activeItem = studentNavItems.find(isActive) || studentNavItems[0];
      const el = activeItem && navLinkRefs.current[activeItem.to];
      if (el && navRef.current) {
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
      }
    };
    measure();
    // Re-measure once the scroll-triggered shrink/grow transition finishes
    const t = setTimeout(measure, 320);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user, scrolled]);

  return (
    <nav
      className={`sticky top-0 z-40 backdrop-blur-md lg:backdrop-blur-2xl border-b transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/70 border-violet-400/30 shadow-lg shadow-purple-950/50'
          : 'bg-slate-950/40 border-violet-400/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className={`relative rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-all overflow-hidden flex items-center justify-center ${scrolled ? 'w-9 h-9' : 'w-10 h-10'}`}>
              <img
                src="/logo.webp"
                alt="DATAVERSE Logo"
                width="40"
                height="40"
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
              <span className={`font-black tracking-wider text-white transition-all duration-300 ${scrolled ? 'text-lg' : 'text-xl'}`}>
                DATA<span className="gradient-text">VERSE</span>
              </span>
              <span className="text-[10px] block font-bold text-indigo-400 tracking-widest uppercase -mt-1">
                AAMEC 2026
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div
            ref={navRef}
            className={`relative hidden lg:flex items-center text-xs font-bold text-slate-300 transition-all duration-300 ${
              scrolled ? 'gap-6' : 'gap-8'
            }`}
          >
            {studentNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                ref={(el) => { navLinkRefs.current[item.to] = el; }}
                className={`relative z-10 pb-1 transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive(item) ? 'text-indigo-400' : 'hover:text-indigo-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* Sliding underline indicator */}
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 transition-all duration-300 ease-out"
              style={{
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-3 lg:p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center"
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
                  {...registerMagnetic}
                  className="btn-glow px-5 py-2.5 rounded-xl text-white font-extrabold shadow-lg shadow-indigo-600/30 will-change-transform"
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
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="p-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu background tap-out overlay */}
      {mobileMenuOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-6 space-y-4 text-sm font-semibold">
          {studentNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 ${isActive(item) ? 'text-indigo-400 border-l-4 border-indigo-500 pl-3' : 'text-slate-200'}`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full py-3 text-center rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
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
