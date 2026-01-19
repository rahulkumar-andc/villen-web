
import React, { useEffect, useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import '../admin/Admin.css';

export const MonitorDashboard = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/dashboard/monitor/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [token]);

    if (!data) return <div className="loading">Establishing Uplink...</div>;

    return (
        <div className="admin-container">
            <div className="container">
                <ScrollReveal>
                    <div className="admin-header">
                        <h1 className="glitch" data-text="WATCHTOWER">WATCHTOWER</h1>
                        <p className="subtitle">CONTENT MODERATION // LEVEL 3</p>
                    </div>
                </ScrollReveal>

                <div className="admin-section">
                    <h2><AlertCircle size={20} /> Pending Reports ({data.moderation_queue_count})</h2>
                    <div className="report-grid">
                        {data.pending_reports.map(report => (
                            <div key={report.id} className="report-card">
                                <div className="report-header">
                                    <span className="report-email">{report.email}</span>
                                    <span className="report-time">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="report-body">{report.message}</p>
                                <div className="report-actions">
                                    <button className="btn-small"><CheckCircle size={14} /> Resolve</button>
                                    <button className="btn-small danger"><Eye size={14} /> Investigate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
