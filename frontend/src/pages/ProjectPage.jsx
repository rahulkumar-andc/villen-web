import React, { useState, useEffect } from 'react';
import { ExternalLink, Github, Loader } from 'lucide-react';
import './ProjectPage.css';
import ScrollReveal from '../components/ScrollReveal';
import { blogAPI } from '../api/blog'; // We can share the axios instance or create a new one.
// Let's assume we want to use the standard fetch for now or reuse the axios instance if available.
// I'll use standard fetch to minimize dependency on the specific blogAPI helper, 
// or I can quickly create a `projectsAPI` helper. 
// For speed, let's use direct fetch but pointing to the correct relative URL if proxy is set, or absolute.
// Given previous code used localhost:8000, I'll stick to relative `/api/projects/` assuming proxy or CORS.
// Actually, earlier NotesPage used http://127.0.0.1:8000. Let's make it robust.

const API_URL = 'http://127.0.0.1:8000/api';

export const ProjectPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/projects/`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch projects');
                return res.json();
            })
            .then(data => {
                setProjects(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('System Offline. Unable to retrieve arsenal.');
                setLoading(false);
            });
    }, []);

    return (
        <div className="project-page-container">
            <div className="container">
                <ScrollReveal>
                    <div className="project-header">
                        <h1 className="glitch" data-text="Arsenal">Arsenal</h1>
                        <p className="subtitle">DEPLOYED TOOLS & RESEARCH</p>
                    </div>
                </ScrollReveal>

                {error && (
                    <div className="error-state">
                        <span className="blink">⚠️ {error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <Loader className="spin" /> Initializing...
                    </div>
                ) : (
                    <div className="project-grid">
                        {projects.map((project, index) => (
                            <ScrollReveal key={project.id} className="project-card-wrapper">
                                <div className="project-card">
                                    <div className="card-header">
                                        <span className="category-label">{project.category}</span>
                                    </div>
                                    <div className="card-body">
                                        <h3>{project.title}</h3>
                                        <p>{project.tagline}</p>
                                    </div>
                                    <div className="card-footer">
                                        <span className={`status-badge ${project.status_color}`}>
                                            {project.status}
                                        </span>
                                        {project.link ? (
                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-view">
                                                View Project
                                            </a>
                                        ) : (
                                            <button className="btn-view disabled">Private Access</button>
                                        )}
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                )}

                <ScrollReveal>
                    <div className="project-footer-quote">
                        "Every project is a lesson — some in code, some in failure."
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

