import React from 'react';
import './AboutPage.css';
import ScrollReveal from '../components/ScrollReveal';

export const AboutPage = () => {
    return (
        <div className="about-container">
            <div className="container">

                {/* Header Section */}
                <ScrollReveal>
                    <div className="about-header">
                        <h1 className="glitch" data-text="About Villen">About Villen</h1>
                        <h2 className="subtitle">Security Researcher & Developer</h2>
                    </div>
                </ScrollReveal>

                <div className="about-grid">

                    {/* Left Column: Why Villen */}
                    <div className="about-left">
                        <ScrollReveal>
                            <div className="glass-card big-card">
                                <h3>🔍 Why Villen</h3>
                                <div className="card-content">
                                    <p className="emphasis-text">
                                        At my core, I believe in one principle:<br />
                                        <span className="highlight">security through understanding, not obscurity.</span>
                                    </p>

                                    <p>
                                        I don’t just write code — I question systems, probe assumptions,
                                        and break things ethically to understand how they truly work.
                                    </p>

                                    <p>
                                        My work lives at the intersection of <span className="accent">offensive security</span>,
                                        <span className="accent">backend engineering</span>, and <span className="accent">automation</span>.
                                    </p>

                                    <div className="quote-box">
                                        "Every project I build follows a hands-on mindset: learn by doing, test by breaking, and secure by design."
                                    </div>

                                    <p className="tagline">Crafting tools. Breaking systems. Building security — openly.</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: What I Do */}
                    <div className="about-right">
                        <ScrollReveal>
                            <div className="glass-card compact-card">
                                <h3>🔓 Offensive Security & Research</h3>
                                <ul>
                                    <li>Web application security testing</li>
                                    <li>Attack surface mapping & recon</li>
                                    <li>Vulnerability research & PoCs</li>
                                    <li>Ethical exploitation & reporting</li>
                                </ul>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal>
                            <div className="glass-card compact-card">
                                <h3>🧩 Backend & Full-Stack Development</h3>
                                <ul>
                                    <li>Secure backend systems (Django / APIs)</li>
                                    <li>Authentication, authorization & access control</li>
                                    <li>Automation tools & security scripts</li>
                                    <li>Scalable, production-ready architecture</li>
                                </ul>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal>
                            <div className="glass-card compact-card">
                                <h3>🌐 OSINT & Digital Footprint Analysis</h3>
                                <ul>
                                    <li>Public data intelligence gathering</li>
                                    <li>OSINT tooling & workflow automation</li>
                                    <li>Recon methodologies for red & blue teams</li>
                                </ul>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal>
                            <div className="glass-card compact-card">
                                <h3>🧪 Projects & Experiments</h3>
                                <ul>
                                    <li>Security tools & utilities</li>
                                    <li>Experimental apps & internal frameworks</li>
                                </ul>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Philosophy Section */}
                <ScrollReveal>
                    <div className="philosophy-section">
                        <h3>My Philosophy</h3>
                        <div className="badges-row">
                            <span className="pill-badge">🧠 Learn by building</span>
                            <span className="pill-badge">🔐 Security is a mindset</span>
                            <span className="pill-badge">⚖️ Ethical use only</span>
                            <span className="pill-badge">🧪 Practical over theoretical</span>
                            <span className="pill-badge">🤝 Community-driven</span>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Footer */}
                <ScrollReveal>
                    <div className="about-footer">
                        <p className="glow-text">Silence is safer than noise.</p>
                        <p className="glow-text">Knowledge is stronger than tools.</p>
                    </div>
                </ScrollReveal>

            </div>
        </div>
    );
};
