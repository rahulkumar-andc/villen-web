import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import LandingPage from './pages/LandingPage'
import { HomePage, AboutPage, ProjectPage, ContactPage, NotesPage, MainPage } from './pages'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { BlogGateway, BlogHome, BlogPost } from './pages/blog'
import { PostEditor } from './pages/admin'
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard'
import { AdminDashboard } from './pages/dashboards/AdminDashboard'
import { MonitorDashboard } from './pages/dashboards/MonitorDashboard'
import { PremiumDashboard } from './pages/dashboards/PremiumDashboard'
import Navbar from './components/Navbar'
import TerminalOverlay from './components/TerminalOverlay'
import './pages/Pages.css'

// Layout wrapper to conditionally show Navbar
function AppLayout({ children }) {
  const location = useLocation();
  const isBlogRoute = location.pathname.startsWith('/blog');
  const isAdminRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isBlogRoute && !isAdminRoute && <div className="scanlines"></div>}
      <TerminalOverlay />
      {!isBlogRoute && !isAdminRoute && <Navbar />}
      {children}
    </div>
  );
}

// Protected Route Component
const RoleRoute = ({ children, requiredLevel }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Auth Check...</div>;

  // User must be logged in and have a role level <= requiredLevel (Lower level = higher power)
  if (!user || !user.role || user.role.level > requiredLevel) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Smart Dashboard Router
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Accessing Mainframe...</div>;
  if (!user || !user.role) return <Navigate to="/login" replace />;

  switch (user.role.level) {
    case 1: return <SuperAdminDashboard />;
    case 2: return <AdminDashboard />;
    case 3: return <MonitorDashboard />;
    case 5: return <PremiumDashboard />;
    default: return <Navigate to="/home" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/projects" element={<ProjectPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Blog Routes - Separate Identity */}
              <Route path="/blog" element={<BlogGateway />} />
              <Route path="/blog/home" element={<BlogHome />} />
              <Route path="/blog/post/:slug" element={<BlogPost />} />

              {/* Central Dashboard Hub */}
              <Route path="/admin" element={<DashboardRouter />} />
              <Route path="/dashboard" element={<DashboardRouter />} />

              {/* Specific Protected Routes (Direct Access) */}
              <Route path="/dashboard/super" element={<RoleRoute requiredLevel={1}><SuperAdminDashboard /></RoleRoute>} />
              <Route path="/dashboard/admin" element={<RoleRoute requiredLevel={2}><AdminDashboard /></RoleRoute>} />
              <Route path="/dashboard/monitor" element={<RoleRoute requiredLevel={3}><MonitorDashboard /></RoleRoute>} />
              <Route path="/dashboard/premium" element={<RoleRoute requiredLevel={5}><PremiumDashboard /></RoleRoute>} />

              <Route path="/admin/posts/new" element={<RoleRoute requiredLevel={2}><PostEditor /></RoleRoute>} />
              <Route path="/admin/posts/edit/:slug" element={<RoleRoute requiredLevel={2}><PostEditor /></RoleRoute>} />
            </Routes>
          </AppLayout>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App



