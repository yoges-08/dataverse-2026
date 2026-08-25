import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import LoginCanvasBackground from '../components/LoginCanvasBackground';
import useMagneticHover from '../utils/useMagneticHover';

export default function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const magnetic = useMagneticHover(0.2);

  // Tracks whether THIS component is already handling the post-login
  // redirect itself (with the animation delay). When true, the effect
  // below must not also try to redirect -- otherwise the two race and
  // the animation never gets seen.
  const justLoggedInRef = useRef(false);

  useEffect(() => {
    if (user && !justLoggedInRef.current) {
      redirectByRole(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const redirectByRole = (role) => {
    // If the student came here from clicking "Register" on an event, send
    // them back to the events page so they can pick up where they left off.
    const pending = location.state?.from;
    if (role === 'student' && pending) {
      navigate(pending, { replace: true });
      return;
    }
    switch (role) {
      case 'super_admin': navigate('/dashboard/admin', { replace: true }); break;
      case 'coordinator': navigate('/dashboard/coordinator', { replace: true }); break;
      case 'volunteer': navigate('/dashboard/volunteer', { replace: true }); break;
      case 'co_organizer': navigate('/dashboard/co-organizer', { replace: true }); break;
      default: navigate('/dashboard/student', { replace: true }); break;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await login(email, password);
      if (res.success) {
        justLoggedInRef.current = true; // tell the effect above to stand down
        setShowSuccess(true);
        setTimeout(() => redirectByRole(res.user.role), 900);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="login-canvas-wrap glass-card p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6 relative">
        <LoginCanvasBackground />

        {/* Success overlay */}
        <div className={`login-success-overlay ${showSuccess ? 'visible' : ''}`}>
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>Welcome In</h2>
        </div>

        <div className="relative z-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white">DATAVERSE Login</h1>
          <p className="text-xs text-slate-400">Sign in to access your portal & tickets</p>
        </div>

        {errorMsg && (
          <div className="relative z-10 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10 space-y-5 text-xs">
          <div className="floating-input-group">
            <input
              type="text"
              id="email"
              required
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="email">Email Address</label>
          </div>

          <div className="floating-input-group relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              required
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="password">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-400 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end -mt-2">
            <Link to="/forgot-password" className="text-indigo-400 hover:underline">Forgot password?</Link>
          </div>

          <button
            ref={magnetic.ref}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            style={{ transition: 'transform 0.15s ease-out' }}
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="relative z-10 text-center text-slate-400 text-xs">
          New participant? <Link to="/register" className="text-indigo-400 font-bold hover:underline">Register for DATAVERSE</Link>
        </p>
      </div>
    </div>
  );
}