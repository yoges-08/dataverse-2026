import React, { lazy, Suspense, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import ScrollToTop from './components/ScrollToTop';
import { AuthContext } from './context/AuthContext';

// Pages (code-split so the initial bundle stays small and fast)
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Events = lazy(() => import('./pages/Events'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'));
const MyCertificates = lazy(() => import('./pages/MyCertificates'));

// Dashboards (heavy — loaded on demand only)
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));
const CoordinatorDashboard = lazy(() => import('./pages/dashboards/CoordinatorDashboard'));
const VolunteerDashboard = lazy(() => import('./pages/dashboards/VolunteerDashboard'));

const PageLoader = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
    <p className="text-sm">Loading...</p>
  </div>
);

const getRoleDashboard = (role) => {
  switch (role) {
    case 'super_admin': return '/dashboard/admin';
    case 'coordinator': return '/dashboard/coordinator';
    case 'volunteer': return '/dashboard/volunteer';
    case 'student': return '/dashboard/student';
    default: return '/login';
  }
};

// Route guard: redirects unauthenticated users away from protected routes
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
        <p className="text-sm">Loading your session...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Role guard: ensures only matching role can view a dashboard
function RoleRoute({ role, children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
        <p className="text-sm">Loading your session...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role && user.role !== 'super_admin') {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }
  return children;
}

// Redirect /dashboard to the role-specific dashboard
function DashboardRedirect() {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
        <p className="text-sm">Loading your session...</p>
      </div>
    );
  }
  return <Navigate to={getRoleDashboard(user?.role)} replace />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify/:certNo?" element={<CertificateVerify />} />
            <Route path="/certificates" element={<RoleRoute role="student"><MyCertificates /></RoleRoute>} />

            {/* Role Dashboards (protected) */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/dashboard/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<RoleRoute role="super_admin"><AdminDashboard /></RoleRoute>} />
            <Route path="/dashboard/coordinator" element={<RoleRoute role="coordinator"><CoordinatorDashboard /></RoleRoute>} />
            <Route path="/dashboard/volunteer" element={<RoleRoute role="volunteer"><VolunteerDashboard /></RoleRoute>} />

            {/* Legacy team edit-code links now redirect to login (team management
                moved in-app to the student dashboard; there is no link-based UI). */}
            <Route path="/team/:editCode" element={<Navigate to="/login" replace />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
        </main>
        <Footer />
        <BackToTop />
        </div>
      </div>
    </Router>
  );
}

function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
      <span className="text-6xl font-black text-indigo-500">404</span>
      <h1 className="text-3xl font-black text-white">Page Not Found</h1>
      <p className="text-sm text-slate-400">
        The page you are looking for doesn't exist. You may be looking for the
        <a href="/login" className="text-indigo-400 font-bold mx-1">Sign In</a>page,
        your <a href="/dashboard" className="text-indigo-400 font-bold mx-1">Dashboard</a>,
        or the <a href="/events" className="text-indigo-400 font-bold mx-1">Events</a> catalog.
      </p>
      <a href="/" className="inline-block mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30">
        Back to Home
      </a>
    </div>
  );
}
