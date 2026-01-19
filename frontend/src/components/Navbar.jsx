import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Folder, Mail, FileText, Shield, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CyberGate from './CyberGate';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [gateClosing, setGateClosing] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleBrandClick = () => {
        if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const handleLogout = async () => {
        setMobileOpen(false);
        setGateClosing(true);
    };

    const handleGateComplete = async () => {
        if (gateClosing) {
            await logout();
            setGateClosing(false);
            navigate('/login');
        }
    };

    const handleNavClick = () => {
        setMobileOpen(false);
    };

    return (
        <>
            {/* Cyber Gate for Logout */}
            {gateClosing && (
                <CyberGate isOpen={false} onAnimationComplete={handleGateComplete} />
            )}

            <nav className="navbar">
                <div className="nav-brand" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
                    <Shield className="nav-icon" /> Shadow Layer
                </div>

                {/* Hamburger Button */}
                <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
                    <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <Home size={18} /> Home
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <User size={18} /> About
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <Folder size={18} /> Projects
                    </NavLink>
                    <NavLink to="/notes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <FileText size={18} /> Notes
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <Mail size={18} /> Contact
                    </NavLink>
                    <NavLink to="/blog" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                        <FileText size={18} /> Blog
                    </NavLink>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} className="nav-link nav-auth-btn">
                            <LogOut size={18} /> Logout
                        </button>
                    ) : (
                        <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                            <LogIn size={18} /> Login
                        </NavLink>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;



