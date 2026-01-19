
import React, { useEffect, useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Activity, Lock, Server } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';
import '../admin/Admin.css'; // Reuse existing admin styles

export const SuperAdminDashboard = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/dashboard/super/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [token]);

    if (!data) return <div className="loading">Initializing God Mode...</div>;

    return (
        <div className="admin-container">
            <div className="container">
                <ScrollReveal>
                    <div className="admin-header">
                        <h1 className="glitch" data-text="SYSTEM OVERSEER">SYSTEM OVERSEER</h1>
                        <p className="subtitle">ROOT ACCESS GRANTED // LEVEL 1</p>
                    </div>
                </ScrollReveal>

                {/* System Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <Users size={24} color="#00ff9d" />
                        <h3>{data.stats.total_users}</h3>
                        <p>Total Users</p>
                    </div>
                    <div className="stat-card">
                        <Shield size={24} color="#bd00ff" />
                        <h3>{data.stats.total_admins}</h3>
                        <p>Admin Count</p>
                    </div>
                    <div className="stat-card">
                        <Server size={24} color="#00d4ff" />
                        <h3>{data.stats.system_status}</h3>
                        <p>System Integrity</p>
                    </div>
                </div>

                {/* Audit Logs */}
                <ScrollReveal>
                    <div className="admin-section">
                        <h2><Activity size={20} /> Security Audit Stream</h2>
                        <div className="log-console">
                            {data.recent_logs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    <span className="log-time">[{new Date(log.time).toLocaleTimeString()}]</span>
                                    <span className="log-actor">{log.actor}</span>
                                    <span className="log-action">executed {log.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                {/* Admin Management */}
                <ScrollReveal>
                    <div className="admin-section">
                        <h2><Lock size={20} /> Admin Hierarchy</h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.admins.map(admin => (
                                    <tr key={admin.id}>
                                        <td>{admin.username}</td>
                                        <td>{admin.email}</td>
                                        <td><span className="role-badge">{admin.profile__role__name}</span></td>
                                        <td>
                                            <button className="btn-small danger">Demote</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};
