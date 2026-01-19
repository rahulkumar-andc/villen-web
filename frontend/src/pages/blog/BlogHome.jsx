import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { blogAPI } from '../../api/blog';
import './Blog.css';

export default function BlogHome() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
        loadPosts('all');
    }, []);

    const loadCategories = async () => {
        const data = await blogAPI.getCategories();
        setCategories(data);
    };

    const loadPosts = async (category) => {
        setLoading(true);
        const data = await blogAPI.getPosts(category);
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        loadPosts(category);
    };

    const handlePostClick = (slug) => {
        navigate(`/blog/post/${slug}`);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="blog-home">
            {/* Hero Section */}
            <section className="blog-hero">
                <div className="blog-hero-text">
                    <h1>
                        Villen Logs —<br />
                        <span>Thoughts, Code & Shadows</span>
                    </h1>
                    <p className="blog-hero-subtitle">
                        Security <span>•</span> Development <span>•</span> Real Stories
                    </p>
                </div>
            </section>

            {/* Category Filters */}
            <div className="blog-categories">
                <button
                    className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                >
                    ALL
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(cat.slug)}
                    >
                        {cat.name.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Blog Grid */}
            {loading ? (
                <div className="blog-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="blog-card" style={{ opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
                            <span className="card-category">Loading...</span>
                            <h2 className="card-title">Loading post...</h2>
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--blog-text-muted)', padding: '3rem' }}>
                    No posts found. Add posts via Django Admin.
                </div>
            ) : (
                <div className="blog-grid">
                    {posts.map(post => (
                        <article
                            key={post.id}
                            className="blog-card"
                            onClick={() => handlePostClick(post.slug)}
                        >
                            <span className={`card-category ${post.category?.slug || ''}`}>
                                {post.category?.name || 'Uncategorized'}
                                {post.is_restricted && ' 🔒'}
                            </span>
                            <h2 className="card-title">{post.title}</h2>
                            <p className="card-excerpt">{post.excerpt}</p>
                            <div className="card-meta">
                                <span>{formatDate(post.created_at)}</span>
                                <span className="reading-time">
                                    <Clock size={14} />
                                    {post.reading_time_mins} min read
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
