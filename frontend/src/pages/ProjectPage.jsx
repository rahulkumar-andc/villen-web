import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Github, Loader } from 'lucide-react';
import './ProjectPage.css';
import ScrollReveal from '../components/ScrollReveal';
import ProjectFilter from '../components/ProjectFilter';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { API_BASE_URL } from '../api/config';

export const ProjectPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        fetch(`${API_BASE_URL}/projects/`)
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

    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Filter by category
        if (filter !== 'all') {
            result = result.filter(p => p.category === filter);
        }

        // Sort
        switch (sortBy) {
            case 'date':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'date-asc':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                break;
        }

        return result;
    }, [projects, filter, sortBy]);

    const handleFilterChange = (newFilter, newSort) => {
        setFilter(newFilter);
        setSortBy(newSort);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'status-green',
            'Research': 'status-yellow',
            'Coming Soon': 'status-grey',
            'Legacy': 'status-red'
        };
        return colors[status] || 'status-grey';
    };

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

                {/* Project Filter */}
                <ScrollReveal>
                    <ProjectFilter projects={projects} onFilterChange={handleFilterChange} />
                </ScrollReveal>

                {loading ? (
                    <div className="loading-state">
                        <SkeletonLoader count={6} className="grid" />
                    </div>
                ) : (
                    <>
                        <div className="project-count">
                            Showing {filteredProjects.length} of {projects.length} projects
                        </div>
                        
                        <div className="project-grid">
                            {filteredProjects.map((project) => (
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
                                            <span className={`status-badge ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                            {project.link ? (
                                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-view">
                                                    <ExternalLink size={14} /> View Project
                                                </a>
                                            ) : (
                                                <button className="btn-view disabled">Private Access</button>
                                            )}
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {filteredProjects.length === 0 && (
                            <div className="empty-state">
                                No projects found in this category.
                            </div>
                        )}
                    </>
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

