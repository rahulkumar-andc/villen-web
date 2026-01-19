
import React, { useEffect, useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { Diamond, Lock, Download } from 'lucide-react';
import '../admin/Admin.css';

export const PremiumDashboard = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/dashboard/premium/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [token]);

    if (!data) return <div className="loading">Verifying Blueprint Access...</div>;

    return (
        <div className="admin-container premium-theme">
            <div className="container">
                <ScrollReveal>
                    <div className="admin-header">
                        <h1 className="glitch" data-text="ELITE ACCESS">ELITE ACCESS</h1>
                        <p className="subtitle">LEVEL 5 CLEARANCE GRANTED</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal>
                    <div className="premium-content">
                        <h2><Diamond size={20} /> Exclusive Assets</h2>
                        <ul className="asset-list">
                            {data.exclusive_content.map((item, i) => (
                                <li key={i} className="asset-item">
                                    <Lock size={16} /> {item}
                                    <span className="download-icon"><Download size={14} /></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};
