import React, { useState } from 'react';
import { API_BASE_URL } from '../api/config';
import './ContactPage.css';
import ScrollReveal from '../components/ScrollReveal';
import { Send, Terminal } from 'lucide-react';

export const ContactPage = () => {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Transmitting...');
        try {
            const res = await fetch(`${API_BASE_URL}/contact/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: e.target.name.value,
                    email: e.target.email.value,
                    message: e.target.message.value
                })
            });
            if (res.ok) {
                setStatus('Transmission Received. Stand by.');
                e.target.reset(); // Clear form
            } else {
                setStatus('Transmission Failed. Signal Jammed.');
            }
        } catch (e) {
            setStatus('Network Unreachable. System Offline.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-container">
            <div className="container">
                <ScrollReveal>
                    <div className="contact-header">
                        <h1 className="glitch" data-text="Secure Channel">Secure Channel</h1>
                        <p className="subtitle">ENCRYPTED TRANSMISSION</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal>
                    <div className="contact-card">
                        <div className="terminal-header">
                            <Terminal size={18} />
                            <span>secure_uplink.exe</span>
                        </div>
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Codename</label>
                                <input type="text" name="name" placeholder="Enter identification..." required />
                            </div>
                            <div className="form-group">
                                <label>Frequency (Email)</label>
                                <input type="email" name="email" placeholder="Enter secure channel..." required />
                            </div>
                            <div className="form-group">
                                <label>Message Payload</label>
                                <textarea name="message" placeholder="Encrypting message content..." rows="5" required></textarea>
                            </div>

                            <button className="btn-transmit" disabled={loading}>
                                {loading ? 'Transmitting...' : (
                                    <>Transmit <Send size={16} /></>
                                )}
                            </button>
                        </form>
                        {status && <div className="status-message">
                            <span className="blink">&gt;</span> {status}
                        </div>}
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};
