import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import heroImg from '../assets/hero.png';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <div className="hero-bg">
                <img src={heroImg} alt="Shadow Layer Background" />
            </div>

            <div className="hero-content">
                <div className="hero-supertitle">Welcome to the</div>
                <h1 className="hero-title glitch" data-text="Shadow Layer">Shadow Layer</h1>
                <h2 className="hero-subtitle">Where Code Becomes Armor</h2>

                <p className="hero-description">
                    I design and build secure, high-performance digital systems.
                    From offensive security to scalable backend engineering —
                    everything here is crafted to survive real-world chaos.
                </p>

                <div className="hero-actions">
                    <button className="btn btn-primary" onClick={() => {
                        document.getElementById('home-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Enter Arsenal <ArrowRight size={18} />
                    </button>

                    <button className="btn btn-secondary" onClick={() => navigate('/notes')}>
                        View Case Files <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
