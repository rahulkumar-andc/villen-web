nimport React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Comments.css';

// Mock comments data
const mockComments = [
  {
    id: 1,
    author: 'ShadowHunter',
    avatar: null,
    content: 'Great article! The section on penetration testing really helped me understand the methodology better.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    badge: 'Regular'
  },
  {
    id: 2,
    author: 'CyberNinja',
    avatar: null,
    content: 'I have been looking for this exact approach. The code examples are very clear.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    badge: 'Contributor'
  },
  {
    id: 3,
    author: 'Anonymous',
    avatar: null,
    content: 'Well written. The security considerations section is particularly valuable.',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    badge: 'Guest'
  }
];

const Comments = ({ postId }) => {
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || (!authorName.trim() && !user)) {
      setError('Please enter your name and comment.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const comment = {
        id: Date.now(),
        author: user?.username || authorName,
        content: newComment,
        created_at: new Date().toISOString(),
        badge: user?.role?.name || 'Guest'
      };
      
      setComments([comment, ...comments]);
      setNewComment('');
      setAuthorName('');
      setSubmitting(false);
    }, 1000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const badgeColors = {
    'Super Admin': 'badge-red',
    'Admin': 'badge-orange',
    'Contributor': 'badge-blue',
    'Regular': 'badge-green',
    'Guest': 'badge-grey'
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <MessageSquare size={24} />
        <h3>Intel Exchange ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      <form className="comment-form" onSubmit={handleSubmit}>
        {!user && (
          <div className="form-group">
            <label>
              <User size={14} />
              Codename
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter your alias..."
              maxLength={50}
            />
          </div>
        )}
        
        <div className="form-group">
          <label>
            <Shield size={14} />
            Intelligence
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your insights..."
            rows={4}
            maxLength={1000}
          />
        </div>

        {error && (
          <div className="comment-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={submitting}>
          <Send size={16} />
          {submitting ? 'Transmitting...' : 'Submit Intel'}
        </button>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="comment-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="comment-avatar">
                <div className="avatar-placeholder small">
                  <Shield size={16} />
                </div>
              </div>
              
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.author}
                  </span>
                  <span className={`comment-badge ${badgeColors[comment.badge] || 'badge-grey'}`}>
                    {comment.badge}
                  </span>
                  <span className="comment-time">
                    <Clock size={12} />
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="no-comments">
            <MessageSquare size={32} />
            <p>No intelligence exchanged yet. Be the first.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Comments;

