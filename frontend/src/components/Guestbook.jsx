import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Shield } from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import './Guestbook.css';

const Guestbook = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  // Simulated guestbook messages (replace with backend endpoint)
  useEffect(() => {
    // In production, fetch from API
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          name: 'ShadowHunter',
          message: 'Great security tools! The OSINT framework is amazing.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          badge: 'Regular'
        },
        {
          id: 2,
          name: 'CyberNinja',
          message: 'Love the cyber-themed design. Keep up the great work!',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          badge: 'Contributor'
        },
        {
          id: 3,
          name: 'Anonymous',
          message: 'Found your blog through a CTF. Your writeups are gold!',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          badge: 'Guest'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !newMessage.trim()) {
      setStatus('Name and message required.');
      return;
    }

    setSubmitting(true);
    setStatus('Transmitting...');

    // Simulate API call
    setTimeout(() => {
      const message = {
        id: Date.now(),
        name: name,
        message: newMessage,
        created_at: new Date().toISOString(),
        badge: 'Guest'
      };
      
      setMessages([message, ...messages]);
      setNewMessage('');
      setName('');
      setStatus('Transmission received. Welcome to the guestbook.');
      setSubmitting(false);
    }, 1000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const badgeColors = {
    'Super Admin': 'badge-red',
    'Admin': 'badge-orange',
    'Contributor': 'badge-blue',
    'Regular': 'badge-green',
    'Guest': 'badge-grey'
  };

  return (
    <section className="guestbook-section">
      <div className="guestbook-header">
        <MessageSquare size={24} />
        <h2>Guestbook</h2>
        <span className="guestbook-count">{messages.length} entries</span>
      </div>

      <form className="guestbook-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              <User size={14} />
              Codename
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your alias..."
              maxLength={50}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>
            <Shield size={14} />
            Message
          </label>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Leave a message for the Shadow Layer..."
            rows={4}
            maxLength={500}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={submitting}>
          <Send size={16} />
          {submitting ? 'Transmitting...' : 'Sign Guestbook'}
        </button>

        {status && <div className="guestbook-status">{status}</div>}
      </form>

      <div className="guestbook-messages">
        {loading ? (
          <div className="guestbook-loading">
            <div className="loading-spinner" />
            <p>Retrieving entries...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="guestbook-message">
              <div className="message-header">
                <span className="message-name">
                  <Shield size={14} />
                  {msg.name}
                </span>
                <span className={`message-badge ${badgeColors[msg.badge] || 'badge-grey'}`}>
                  {msg.badge}
                </span>
              </div>
              <p className="message-content">{msg.message}</p>
              <div className="message-footer">
                <Clock size={12} />
                <span>{formatDate(msg.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Guestbook;

