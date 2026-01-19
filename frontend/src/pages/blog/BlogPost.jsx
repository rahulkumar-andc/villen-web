import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Lock } from 'lucide-react';
import { blogAPI } from '../../api/blog';
import { useAuth } from '../../context/AuthContext';
import './Blog.css';

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [readingProgress, setReadingProgress] = useState(0);

    useEffect(() => {
        loadPost();
    }, [slug]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            setReadingProgress(Math.min(progress, 100));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadPost = async () => {
        setLoading(true);
        setError(null);
        const data = await blogAPI.getPost(slug);

        if (data.error || data.is_restricted) {
            setError(data.error || 'Access denied');
            setLoading(false);
            return;
        }

        setPost(data);
        setLoading(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Split content into lines for terminal effect
    const contentLines = post?.content?.split('\n').filter(line => line.trim()) || [];

    if (loading) {
        return (
            <div className="blog-post">
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--blog-text-muted)' }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="blog-post">
                <button className="back-btn" onClick={() => navigate('/blog/home')}>
                    <ArrowLeft size={16} />
                    Back to Logs
                </button>
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <Lock size={48} style={{ color: 'var(--blog-accent)', marginBottom: '1rem' }} />
                    <h2 style={{ color: 'var(--blog-accent)' }}>Restricted Content</h2>
                    <p style={{ color: 'var(--blog-text-muted)', marginTop: '1rem' }}>
                        {error}
                    </p>
                    {!isAuthenticated && (
                        <button
                            className="gateway-btn"
                            style={{ marginTop: '2rem' }}
                            onClick={() => navigate('/login')}
                        >
                            LOGIN TO ACCESS
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="blog-post">
            {/* Reading Progress Bar */}
            <div className="reading-progress" style={{ width: `${readingProgress}%` }}></div>

            {/* Back Button */}
            <button className="back-btn" onClick={() => navigate('/blog/home')}>
                <ArrowLeft size={16} />
                Back to Logs
            </button>

            {/* Post Header */}
            <header className="post-header">
                <span className="post-category">{post.category?.name || 'Uncategorized'}</span>
                <h1 className="post-title">{post.title}</h1>
                <div className="post-meta">
                    <span><Calendar size={14} /> {formatDate(post.created_at)}</span>
                    <span><Clock size={14} /> {post.reading_time_mins} min read</span>
                    <span>By {post.author_name}</span>
                </div>
            </header>

            {/* Terminal-style Content */}
            <article className="post-content">
                {contentLines.map((line, index) => (
                    <div key={index} className="terminal-line">
                        <span className="line-number">{String(index + 1).padStart(2, '0')}</span>
                        <div className="line-content">
                            {line.startsWith('## ') ? (
                                <h2 style={{ color: 'var(--blog-accent)', marginTop: '1rem' }}>
                                    {line.replace('## ', '')}
                                </h2>
                            ) : line.startsWith('### ') ? (
                                <h3 style={{ color: 'var(--blog-accent-alt)', marginTop: '0.5rem' }}>
                                    {line.replace('### ', '')}
                                </h3>
                            ) : (
                                <p>{line}</p>
                            )}
                        </div>
                    </div>
                ))}
                <div className="terminal-line">
                    <span className="line-number">{String(contentLines.length + 1).padStart(2, '0')}</span>
                    <div className="line-content">
                        <span className="terminal-cursor"></span>
                    </div>
                </div>
            </article>
        </div>
    );
}
