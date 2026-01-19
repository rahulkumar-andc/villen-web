
import React, { useEffect, useState } from 'react';
import ScrollReveal from '../../components/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Flag } from 'lucide-react';
import '../admin/Admin.css';

export const AdminDashboard = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/dashboard/admin/', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [token]);

    if (!data) return <div className="loading">Loading Operations...</div>;

    return (
        <div className="admin-container">
            <div className="container">
                <ScrollReveal>
                    <div className="admin-header">
                        <h1 className="glitch" data-text="OPERATIONS COMMAND">OPERATIONS COMMAND</h1>
                        <p className="subtitle">USER MANAGEMENT // LEVEL 2</p>
                    </div>
                </ScrollReveal>

                <div className="stats-grid">
                    <div className="stat-card">
                        <Users size={24} />
                        <h3>{data.stats.total_users}</h3>
                        <p>Total Users</p>
                    </div>
                    <div className="stat-card">
                        <Flag size={24} color="#ffd700" />
                        <h3>{data.stats.premium_users}</h3>
                        <p>Premium Users</p>
                    </div>
                </div>

                <ScrollReveal>
                    <div className="admin-section">
                        <h2><UserPlus size={20} /> New Registrations</h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.new_users.map((u, i) => (
                                    <tr key={i}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>{new Date(u.joined).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn-small">Manage</button>
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
