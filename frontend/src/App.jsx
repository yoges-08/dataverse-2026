import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Schedule from './pages/Schedule';
import Gallery from './pages/Gallery';
import Sponsors from './pages/Sponsors';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CertificateVerify from './pages/CertificateVerify';

import StudentDashboard from './pages/dashboards/StudentDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import CoordinatorDashboard from './pages/dashboards/CoordinatorDashboard';
import VolunteerDashboard from './pages/dashboards/VolunteerDashboard';

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.15),transparent_55%)]">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 animate-pulse" />
          <p className="text-indigo-300 text-sm font-semibold tracking-widest animate-pulse">Loading DATAVERSE...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'super_admin'
      ? '/dashboard/admin'
      : user.role === 'coordinator'
        ? '/dashboard/coordinator'
        : user.role === 'volunteer'
          ? '/dashboard/volunteer'
          : '/dashboard/student';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/certificate-verify" element={<CertificateVerify />} />
        <Route path="/certificate-verify/:certNo" element={<CertificateVerify />} />
      </Route>

      <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route index element={<StudentDashboard />} />
      </Route>

      <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route index element={<AdminDashboard />} />
      </Route>

      <Route path="/dashboard/coordinator" element={<ProtectedRoute allowedRoles={['coordinator']} />}>
        <Route index element={<CoordinatorDashboard />} />
      </Route>

      <Route path="/dashboard/volunteer" element={<ProtectedRoute allowedRoles={['volunteer']} />}>
        <Route index element={<VolunteerDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
