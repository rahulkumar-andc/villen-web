import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, CircuitBoard, Shield, Search, ArrowRight } from 'lucide-react';
import './HomePage.css';
import heroBg from '../assets/hero.png';
import ScrollReveal from '../components/ScrollReveal';

export const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="home-bg_overlay">
                <img src={heroBg} alt="Background" />
                <div className="bg-gradient"></div>
            </div>

            {/* Main Content */}
            <div className="home-content container">

                {/* Hero Section */}
                <div className="home-hero">
                    <h1 className="brand-title glitch" data-text="VILLEN">VILLEN</h1>
                    <h2 className="brand-subtitle">SECURE & INNOVATIVE DIGITAL SYSTEMS</h2>
                    <p className="brand-desc">
                        I build high-performance apps and robust<br />
                        cyber defenses for the digital age.
                    </p>

                    <button className="btn-glow" onClick={() => navigate('/projects')}>
                        View Projects <ArrowRight size={18} />
                    </button>
                </div>

                {/* Stats Row */}
                <ScrollReveal className="stats-row">
                    <div className="stat-item">
                        <div className="stat-number">...20+</div>
                        <div className="stat-label">SECURITY LABS BUILT</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50+</div>
                        <div className="stat-label">PROJECTS COMPLETED</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-text">Ranked in <span className="highlight">TOP 1%</span></div>
                        <div className="stat-label">ON <span className="thm">TRYHACKME</span></div>
                    </div>
                </ScrollReveal>

                {/* Cards Grid */}
                <div className="glass-grid">
                    <ScrollReveal>
                        <div className="glass-card" onClick={() => navigate('/notes')}>
                            <div className="card-icon"><FlaskConical size={32} /></div>
                            <h3>The Lab</h3>
                            <p>Experiments in cybersecurity, coding, and AI.</p>
                            <div className="card-arrow"><ArrowRight size={16} /></div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="glass-card" onClick={() => navigate('/projects')}>
                            <div className="card-icon"><CircuitBoard size={32} /></div>
                            <h3>Featured Projects</h3>
                            <p>Highlighted works solving complex digital challenges.</p>
                            <div className="card-arrow"><ArrowRight size={16} /></div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="glass-card" onClick={() => navigate('/projects')}>
                            <div className="card-icon"><Shield size={32} /></div>
                            <h3>Arsenal</h3>
                            <p>Essential tools, utilities, and coding framework.</p>
                            <div className="card-arrow"><ArrowRight size={16} /></div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="glass-card" onClick={() => navigate('/about')}>
                            <div className="card-icon"><Search size={32} /></div>
                            <h3>Recon</h3>
                            <p>Case studies, write-ups, and recon reports.</p>
                            <div className="card-arrow"><ArrowRight size={16} /></div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Footer / Copyright */}
                <div className="home-footer">
                    <p>Designed in Darkness, Built for Impact</p>
                    <p>© VILLEN. ALL RIGHTS RESERVED.</p>
                </div>
            </div>
        </div>
    );
};
