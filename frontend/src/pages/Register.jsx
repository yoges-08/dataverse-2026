import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import LoginCanvasBackground from '../components/LoginCanvasBackground';

export default function Register() {
  const { user, registerStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  // Tracks whether THIS component is already handling the post-register
  // redirect itself (with the success-animation delay). When true, the
  // effect below must not also redirect -- otherwise the two race and the
  // animation never gets seen (same pattern as Login.jsx).
  const justRegisteredRef = useRef(false);

  useEffect(() => {
    if (user && !justRegisteredRef.current) {
      navigate('/dashboard/student', { replace: true });
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    collegeName: '', // Blank by default as requested
    department: 'Computer Science & Engineering',
    year: 'III',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter your full name';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Please create a password';
    } else if (formData.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your mobile number';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.collegeName.trim()) {
      errors.collegeName = 'Please enter your College Name';
    }

    if (!formData.department.trim()) {
      errors.department = 'Please select your Department';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMsg('Please fix the highlighted fields below.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await registerStudent(formData);
      if (res.success) {
        justRegisteredRef.current = true; // tell the effect above to stand down
        setShowSuccess(true);
        setTimeout(() => navigate('/dashboard/student', { replace: true }), 900);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="login-canvas-wrap glass-card p-8 sm:p-12 rounded-3xl border border-rose-500/30 shadow-2xl space-y-8 relative text-center">
        <LoginCanvasBackground />

        {/* Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping mr-1" />
            <span>Registration Closed</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold">
            <span>All Slots Full • Housefull</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Symposium Registrations Are Closed
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Thank you for the tremendous enthusiasm and overwhelming response! All participant seats for{' '}
            <strong className="text-indigo-400 font-bold">DATAVERSE 2026</strong> have been completely filled. New registrations are now officially closed.
          </p>
        </div>

        {/* Existing Registrations Info Box */}
        <div className="relative z-10 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left space-y-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Already Registered? Your Seat is Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                If you have already registered, your participation is 100% secured. Sign in to access your personal dashboard, view your unique DATAVERSE Ticket Code, download your QR Entry Pass, and view event schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/35 transition-all flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Sign In to Your Dashboard</span>
          </Link>

          <Link
            to="/events"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>Explore Events</span>
          </Link>
        </div>

        {/* Support Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
          <p>
            Questions or inquiries? Reach out to us at{' '}
            <a href="mailto:dataverse2k26ai@gmail.com" className="text-indigo-400 font-bold hover:underline">
              dataverse2k26ai@gmail.com
            </a>
          </p>
          <p>
            Or check our{' '}
            <Link to="/contact" className="text-indigo-400 font-semibold hover:underline">
              Contact Page
            </Link>{' '}
            for student coordinator phone numbers.
          </p>
        </div>

      </div>
    </div>
  );
}
