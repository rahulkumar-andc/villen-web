import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { QueryProvider } from './providers/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import { HomePage, AboutPage, ProjectPage, ContactPage, NotesPage, MainPage } from './pages'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFound from './pages/NotFound'
import { BlogGateway, BlogHome, BlogPost } from './pages/blog'
import { PostEditor } from './pages/admin'
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard'
import { AdminDashboard } from './pages/dashboards/AdminDashboard'
import { MonitorDashboard } from './pages/dashboards/MonitorDashboard'
import { PremiumDashboard } from './pages/dashboards/PremiumDashboard'
import Navbar from './components/Navbar'
import TerminalOverlay from './components/TerminalOverlay'
import ScrollProgress from './components/ScrollProgress'
import BackToTop from './components/BackToTop'
import CustomCursor from './components/CustomCursor'
import PageTransition from './components/PageTransition'
import { SkeletonLoader } from './components/SkeletonLoader'
import './pages/Pages.css'
import './components/MicroInteractions.css'

// Layout wrapper to conditionally show Navbar
function AppLayout({ children }) {
  const location = useLocation();
  const isBlogRoute = location.pathname.startsWith('/blog');
  const isAdminRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      <ScrollProgress />
      <BackToTop />
      <CustomCursor />
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

  if (loading) return <SkeletonLoader className="skeleton-auth-check" count={1} />;

  // User must be logged in and have a role level <= requiredLevel (Lower level = higher power)
  if (!user || !user.role || user.role.level > requiredLevel) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Smart Dashboard Router
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <SkeletonLoader className="skeleton-auth-check" count={1} />;
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
              <Route path="/" element={
                <PageTransition>
                  <MainPage />
                </PageTransition>
              } />
              <Route path="/home" element={
                <PageTransition>
                  <HomePage />
                </PageTransition>
              } />
              <Route path="/about" element={
                <PageTransition>
                  <AboutPage />
                </PageTransition>
              } />
              <Route path="/projects" element={
                <PageTransition>
                  <ProjectPage />
                </PageTransition>
              } />
              <Route path="/contact" element={
                <PageTransition>
                  <ContactPage />
                </PageTransition>
              } />
              <Route path="/notes" element={
                <PageTransition>
                  <NotesPage />
                </PageTransition>
              } />
              <Route path="/login" element={
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              } />
              <Route path="/register" element={
                <PageTransition>
                  <RegisterPage />
                </PageTransition>
              } />
              <Route path="/forgot-password" element={
                <PageTransition>
                  <ForgotPasswordPage />
                </PageTransition>
              } />

              {/* Blog Routes - Separate Identity */}
              <Route path="/blog" element={
                <PageTransition>
                  <BlogGateway />
                </PageTransition>
              } />
              <Route path="/blog/home" element={
                <PageTransition>
                  <BlogHome />
                </PageTransition>
              } />
              <Route path="/blog/post/:slug" element={
                <PageTransition>
                  <BlogPost />
                </PageTransition>
              } />

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

              {/* 404 Not Found */}
              <Route path="*" element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              } />
            </Routes>
          </AppLayout>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

function AppWithProviders() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default AppWithProviders

