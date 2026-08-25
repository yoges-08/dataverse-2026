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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="login-canvas-wrap glass-card p-8 sm:p-10 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-8 relative">
        <LoginCanvasBackground />

        {/* Success overlay */}
        <div className={`login-success-overlay ${showSuccess ? 'visible' : ''}`}>
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>Account Created</h2>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DATAVERSE 2026 Registration</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No Fee • ₹0 Free Entry</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Create Participant Account</h1>
          <p className="text-xs sm:text-sm text-slate-400">Fill in your contact and college details to register for free and receive your unique DATAVERSE Ticket Code & QR Pass.</p>
        </div>

        {/* No Registration Fee Alert Banner */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center space-x-2 font-medium text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong className="font-bold text-emerald-200">No Registration Fee Required:</strong> Registration, food, and event entry are completely free for all participants!</span>
        </div>

        {errorMsg && (
          <div className="relative z-10 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 text-xs">
          
          {/* Section 1: Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              1. Personal & Login Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Balaji S"
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                    fieldErrors.name ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.name}</span>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                    fieldErrors.email ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.email && (
                  <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.email}</span>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 4 characters"
                    className={`w-full p-3 pr-11 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                      fieldErrors.password ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {fieldErrors.password && (
                    <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.password}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength="10"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                    fieldErrors.phone ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.phone && (
                  <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: College Info */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              2. Academic & College Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">College Name *</label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Type your college name..."
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                    fieldErrors.collegeName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {fieldErrors.collegeName && (
                  <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.collegeName}</span>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-indigo-500 ${
                    fieldErrors.department ? 'border-red-500' : 'border-slate-700'
                  }`}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
                {fieldErrors.department && (
                  <span className="text-red-400 text-[10px] mt-1 block">{fieldErrors.department}</span>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Year of Study *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/35 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>{loading ? 'Submitting Registration...' : 'Complete DATAVERSE Registration'}</span>
          </button>

        </form>

        <p className="relative z-10 text-center text-slate-400 text-xs">
          Already registered? <Link to="/login" className="text-indigo-400 font-bold hover:underline">Sign in here</Link>
        </p>

      </div>
    </div>
  );
}
