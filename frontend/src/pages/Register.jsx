import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Sparkles, AlertCircle, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { registerStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registerNumber: '',
    collegeName: 'Anjalai Ammal Mahalingam Engineering College',
    department: 'Computer Science & Engineering',
    year: 'III',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    foodPreference: 'Veg',
    accommodationRequired: 'No'
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [collegeIdCard, setCollegeIdCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      if (profilePhoto) data.append('profilePhoto', profilePhoto);
      if (collegeIdCard) data.append('collegeIdCard', collegeIdCard);

      const res = await registerStudent(data);
      if (res.success) {
        navigate('/dashboard/student');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DATAVERSE 2026 Student Registration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Create Participant Account</h1>
          <p className="text-xs sm:text-sm text-slate-400">Fill in your college and contact details to receive your unique DATAVERSE Symposium Code & QR Ticket.</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Section 1: Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              1. Account Credentials & Personal Details
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
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@aamec.edu.in"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: College Info */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              2. Academic & College Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">College Register Number *</label>
                <input
                  type="text"
                  name="registerNumber"
                  required
                  value={formData.registerNumber}
                  onChange={handleChange}
                  placeholder="e.g. 820421104050"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">College Name *</label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Anjalai Ammal Mahalingam Engineering College"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="MCA / Computer Applications">MCA / Computer Applications</option>
                </select>
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

          {/* Section 3: Preferences & Documents */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              3. Verification Files & Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Food Preference *</label>
                <select
                  name="foodPreference"
                  value={formData.foodPreference}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Accommodation Required? *</label>
                <select
                  name="accommodationRequired"
                  value={formData.accommodationRequired}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes (Hostel Stay)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-semibold block mb-1">Upload Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0])}
                  className="w-full text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-600 file:text-white"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-semibold block mb-1">Upload College ID Card</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCollegeIdCard(e.target.files[0])}
                  className="w-full text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-600 file:text-white"
                />
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

        <p className="text-center text-slate-400 text-xs">
          Already registered? <Link to="/login" className="text-indigo-400 font-bold hover:underline">Sign in here</Link>
        </p>

      </div>
    </div>
  );
}
