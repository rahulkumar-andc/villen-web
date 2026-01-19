import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, Settings, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { blogAPI } from '../../api/blog';
import './Admin.css';

export default function AdminDashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if admin
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadPosts();
    }, [isAuthenticated]);

    const loadPosts = async () => {
        setLoading(true);
        const data = await blogAPI.getPosts();
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleDeletePost = async (slug) => {
        if (!confirm('Delete this post?')) return;
        await blogAPI.deletePost(slug);
        loadPosts();
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <span>⚡</span> ADMIN
                </div>
                <nav className="admin-nav">
                    <button
                        className={`admin-nav-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FileText size={18} /> Posts
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} /> Users
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} /> Settings
                    </button>
                </nav>
                <button className="admin-logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab === 'posts' ? 'Blog Posts' : activeTab === 'users' ? 'Users' : 'Settings'}</h1>
                    {activeTab === 'posts' && (
                        <button className="admin-btn-primary" onClick={() => navigate('/admin/posts/new')}>
                            <Plus size={18} /> New Post
                        </button>
                    )}
                </header>

                <div className="admin-content">
                    {activeTab === 'posts' && (
                        <div className="admin-table-container">
                            {loading ? (
                                <p>Loading posts...</p>
                            ) : posts.length === 0 ? (
                                <p className="admin-empty">No posts yet. Create your first post!</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map(post => (
                                            <tr key={post.id}>
                                                <td>{post.title}</td>
                                                <td>{post.category?.name || 'Uncategorized'}</td>
                                                <td>
                                                    <span className={`status-badge ${post.is_public ? 'public' : 'private'}`}>
                                                        {post.is_public ? 'Public' : 'Private'}
                                                    </span>
                                                    {post.is_restricted && (
                                                        <span className="status-badge restricted">🔒</span>
                                                    )}
                                                </td>
                                                <td>{new Date(post.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="admin-action-btn" onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="admin-action-btn delete" onClick={() => handleDeletePost(post.slug)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <p className="admin-empty">User management coming soon...</p>
                    )}

                    {activeTab === 'settings' && (
                        <p className="admin-empty">Settings coming soon...</p>
                    )}
                </div>
            </main>
        </div>
    );
}
