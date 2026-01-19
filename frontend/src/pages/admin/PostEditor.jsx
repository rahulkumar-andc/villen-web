import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Image, Eye, EyeOff, X } from 'lucide-react';
import { blogAPI } from '../../api/blog';
import { useToast } from '../../context/ToastContext';
import './Admin.css';

export default function PostEditor() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const isEditMode = !!slug;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category_id: '',
        is_public: true,
        is_restricted: false,
        min_role_level: 7,
        reading_time_mins: 5
    });

    const [categories, setCategories] = useState([]);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        loadCategories();
        if (isEditMode) {
            loadPost();
        }
    }, [slug]);

    const loadCategories = async () => {
        const data = await blogAPI.getCategories();
        setCategories(data);
        if (data.length > 0 && !isEditMode) {
            setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
    };

    const loadPost = async () => {
        try {
            const post = await blogAPI.getPost(slug);
            setFormData({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                category_id: post.category?.id || '',
                is_public: post.is_public,
                is_restricted: post.is_restricted,
                min_role_level: post.min_role_level || 7,
                reading_time_mins: post.reading_time_mins
            });
        } catch (err) {
            showError('Failed to load post');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditMode) {
                await blogAPI.updatePost(slug, formData);
                success('Post updated successfully');
            } else {
                await blogAPI.createPost(formData);
                success('Post created successfully');
                navigate('/admin');
            }
        } catch (err) {
            showError('Failed to save post');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading editor...</div>;

    return (
        <div className="admin-editor-container">
            <header className="editor-header">
                <button className="back-btn" onClick={() => navigate('/admin')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="editor-actions">
                    <button
                        type="button"
                        className="editor-btn-secondary"
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        {previewMode ? 'Edit' : 'Preview'}
                    </button>
                    <button
                        className="editor-btn-primary"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Post'}
                    </button>
                </div>
            </header>

            <div className={`editor-layout ${previewMode ? 'preview-mode' : ''}`}>
                {/* Editor Form */}
                <div className="editor-form" style={{ display: previewMode ? 'none' : 'block' }}>
                    <div className="form-group full">
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onBlur={!formData.slug ? generateSlug : undefined}
                            placeholder="Post Title"
                            className="editor-input-title"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Slug</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="editor-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="editor-select"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Excerpt</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={3}
                            className="editor-textarea short"
                            placeholder="Brief summary for card preview..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Content (Markdown)</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={20}
                            className="editor-textarea code"
                            placeholder="# Write your masterpiece..."
                        />
                    </div>

                    <div className="form-row options">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_public"
                                checked={formData.is_public}
                                onChange={handleChange}
                            />
                            Public
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_restricted"
                                checked={formData.is_restricted}
                                onChange={handleChange}
                            />
                            Restricted (Login Required)
                        </label>

                        <div className="form-group small">
                            <label>Read Time (min)</label>
                            <input
                                type="number"
                                name="reading_time_mins"
                                value={formData.reading_time_mins}
                                onChange={handleChange}
                                className="editor-input"
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                {(previewMode) && (
                    <div className="editor-preview blog-post">
                        <article className="post-content">
                            <h1>{formData.title}</h1>
                            {formData.content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </article>
                    </div>
                )}
            </div>
        </div>
    );
}
