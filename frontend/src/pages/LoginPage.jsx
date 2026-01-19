import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CyberGate from '../components/CyberGate';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [gateOpen, setGateOpen] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            // Trigger gate opening animation
            setGateOpen(true);
        } else {
            setError(result.error || 'Login failed');
        }
    };

    const handleGateComplete = () => {
        if (gateOpen) {
            navigate('/');
        }
    };

    return (
        <div className="auth-page">
            {/* Cyber Gate Animation */}
            <CyberGate isOpen={gateOpen} onAnimationComplete={handleGateComplete} />

            {/* Background effects */}
            <div className="auth-bg-grid"></div>
            <div className="auth-bg-glow"></div>

            <div className="auth-container cyber-card">
                {/* Decorative corners */}
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>

                <div className="auth-header">
                    <div className="access-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="glitch cyber-title" data-text="ACCESS">ACCESS</h1>
                    <p className="cyber-subtitle">// SECURE AUTHENTICATION REQUIRED</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">⚠</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group cyber-input-group">
                        <label>
                            <span className="label-icon">→</span>
                            EMAIL ADDRESS
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="operative@shadowlayer.io"
                            required
                            className="cyber-input"
                        />
                        <div className="input-glow"></div>
                    </div>

                    <div className="form-group cyber-input-group">
                        <label>
                            <span className="label-icon">→</span>
                            PASSWORD
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                            className="cyber-input"
                        />
                        <div className="input-glow"></div>
                    </div>

                    <button type="submit" className="cyber-btn" disabled={loading}>
                        <span className="btn-text">
                            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                        </span>
                        <span className="cyber-btn-glow"></span>
                        <span className="btn-shine"></span>
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/forgot-password" className="cyber-link">
                        <span className="link-bracket">[</span>
                        Forgot Password?
                        <span className="link-bracket">]</span>
                    </Link>
                    <span className="footer-divider">|</span>
                    <Link to="/register" className="cyber-link">
                        <span className="link-bracket">[</span>
                        Create Account
                        <span className="link-bracket">]</span>
                    </Link>
                </div>

                <div className="auth-status">
                    <span className="status-dot"></span>
                    SYSTEM READY
                </div>
            </div>
        </div>
    );
}
