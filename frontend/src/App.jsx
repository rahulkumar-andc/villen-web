import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import LandingPage from './pages/LandingPage'
import { HomePage, AboutPage, ProjectPage, ContactPage, NotesPage, MainPage } from './pages'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { BlogGateway, BlogHome, BlogPost } from './pages/blog'
import { AdminDashboard, PostEditor } from './pages/admin'
import Navbar from './components/Navbar'
import TerminalOverlay from './components/TerminalOverlay'
import './pages/Pages.css'

// Layout wrapper to conditionally show Navbar
function AppLayout({ children }) {
  const location = useLocation();
  const isBlogRoute = location.pathname.startsWith('/blog');
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isBlogRoute && !isAdminRoute && <div className="scanlines"></div>}
      <TerminalOverlay />
      {!isBlogRoute && !isAdminRoute && <Navbar />}
      {children}
    </div>
  );
}

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

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/posts/new" element={<PostEditor />} />
              <Route path="/admin/posts/edit/:slug" element={<PostEditor />} />
            </Routes>
          </AppLayout>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App



