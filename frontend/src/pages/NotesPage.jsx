import React, { useState, useEffect } from 'react';
import './NotesPage.css';
import ScrollReveal from '../components/ScrollReveal';
import { Save, FileText, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

export const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Get auth user

    useEffect(() => {
        fetch(`${API_BASE_URL}/notes/`)
            .then(res => res.json())
            .then(data => {
                setNotes(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load notes. Service Unavailable.');
                setLoading(false);
            });
    }, []);

    const addNote = async () => {
        if (!input.trim()) return;
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_URL}/notes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ body: input, title: 'Field Note' })
            });
            if (res.ok) {
                const newNote = await res.json();
                setNotes([newNote, ...notes]);
                setInput('');
            } else {
                setError('Authorization Required or Invalid Input.');
            }
        } catch (err) {
            setError('Failed to save note.');
        }
    };

    return (
        <div className="notes-container">
            <div className="container">
                <ScrollReveal>
                    <div className="notes-header">
                        <h1 className="glitch" data-text="Field Notes">Field Notes</h1>
                        <p className="subtitle">OPERATIONAL LOGS & INTEL</p>
                    </div>
                </ScrollReveal>

                {error && (
                    <div className="error-banner">
                        <AlertTriangle size={20} /> {error}
                    </div>
                )}

                {user ? (
                    <ScrollReveal>
                        <div className="notes-input-card">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter intel report..."
                            />
                            <div className="input-actions">
                                <button className="btn-save" onClick={addNote}>
                                    <Save size={18} /> Save Entry
                                </button>
                            </div>
                        </div>

                    </ScrollReveal>
                ) : (
                    <ScrollReveal>
                        <div className="login-hint">
                            <p>Authenticate to add entries.</p>
                        </div>
                    </ScrollReveal>
                )}

                <div className="notes-grid">
                    {notes.map(note => (
                        <ScrollReveal key={note.id} className="note-card-wrapper">
                            <div className="note-card">
                                <div className="note-meta">
                                    <Clock size={14} />
                                    {new Date(note.created_at).toLocaleString()}
                                </div>
                                <div className="note-body">
                                    <p>{note.body}</p>
                                </div>
                                <div className="note-footer">
                                    <FileText size={14} /> Classified
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                    {notes.length === 0 && !loading && !error && (
                        <div className="empty-state">No intel collected yet.</div>
                    )}
                </div>
            </div>
        </div >
    );
};
