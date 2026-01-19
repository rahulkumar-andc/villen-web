import { API_BASE_URL } from './config';
const API_BASE = `${API_BASE_URL}/blog`;

export const blogAPI = {
    // Get all categories
    async getCategories() {
        const res = await fetch(`${API_BASE}/categories/`);
        return res.json();
    },

    // Get all posts (optional category filter)
    async getPosts(category = 'all') {
        const url = category === 'all'
            ? `${API_BASE}/posts/`
            : `${API_BASE}/posts/?category=${category}`;
        const res = await fetch(url);
        return res.json();
    },

    // Get single post by slug
    async getPost(slug) {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/posts/${slug}/`, { headers });
        return res.json();
    },

    // Create post (admin only)
    async createPost(postData) {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/posts/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        return res.json();
    },

    // Update post
    async updatePost(slug, postData) {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/posts/${slug}/edit/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        return res.json();
    },

    // Delete post
    async deletePost(slug) {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/posts/${slug}/edit/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }
};
