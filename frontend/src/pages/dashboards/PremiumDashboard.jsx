
import React, { useEffect, useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { Diamond, Lock, Download, ShieldAlert, Terminal, Eye, FileText } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';
import '../admin/Admin.css';

export const PremiumDashboard = () => {
    const { token } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [scanLog, setScanLog] = useState([]);

    const runScan = () => {
        setScanning(true);
        setScanLog(['Initializing Dark Web Crawler...']);

        const steps = [
            'Connecting to Tor node 192.168.X.X...',
            'Handshake complete. Tunnel established.',
            'Querying breach databases...',
            'Scanning pastebins for "villen.me"...',
            'Analyzing threat vectors...',
            'Scan Complete. No immediate threats detected.'
        ];

        steps.forEach((step, index) => {
            setTimeout(() => {
                setScanLog(prev => [...prev, step]);
                if (index === steps.length - 1) setScanning(false);
            }, (index + 1) * 1500);
        });
    };

    return (
        <div className="admin-container premium-theme">
            <div className="container">
                <ScrollReveal>
                    <div className="admin-header">
                        <h1 className="glitch" data-text="ELITE ACCESS">ELITE ACCESS</h1>
                        <p className="subtitle">LEVEL 5 CLEARANCE GRANTED</p>
                    </div>
                </ScrollReveal>

                <div className="dashboard-grid">
                    {/* Dark Web Scanner */}
                    <ScrollReveal>
                        <div className="admin-section scanner-panel">
                            <h2><ShieldAlert size={20} color="#ff3e3e" /> Dark Web Monitor</h2>
                            <div className="scanner-interface">
                                <div className="scan-window">
                                    {scanLog.map((log, i) => (
                                        <div key={i} className="scan-line">
                                            <span className="prompt">&gt;</span> {log}
                                        </div>
                                    ))}
                                    {scanning && <div className="scan-line"><span className="blink">_</span></div>}
                                </div>
                                <button
                                    className="btn-scan"
                                    onClick={runScan}
                                    disabled={scanning}
                                >
                                    {scanning ? 'SCANNING...' : 'INITIATE SCAN'}
                                </button>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Zero-Day Vault */}
                    <ScrollReveal>
                        <div className="admin-section">
                            <h2><Lock size={20} color="#ffd700" /> Zero-Day Vault</h2>
                            <div className="vault-grid">
                                <div className="vault-item">
                                    <FileText size={32} />
                                    <div className="vault-info">
                                        <h4>exploit_pack_v4.zip</h4>
                                        <p>Updated: 2h ago</p>
                                    </div>
                                    <button className="btn-icon"><Download size={16} /></button>
                                </div>
                                <div className="vault-item">
                                    <Terminal size={32} />
                                    <div className="vault-info">
                                        <h4>payload_generator.py</h4>
                                        <p>Updated: 1d ago</p>
                                    </div>
                                    <button className="btn-icon"><Download size={16} /></button>
                                </div>
                                <div className="vault-item">
                                    <Eye size={32} />
                                    <div className="vault-info">
                                        <h4>cctv_bypass_module.bin</h4>
                                        <p>Updated: 3d ago</p>
                                    </div>
                                    <button className="btn-icon"><Download size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </div>
    );
};
