const API_BASE = 'http://127.0.0.1:8000/api/auth';

export const authAPI = {
    // Registration Flow
    async sendOTP(email) {
        const res = await fetch(`${API_BASE}/send-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.json();
    },

    async verifyOTP(email, otp) {
        const res = await fetch(`${API_BASE}/verify-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return res.json();
    },

    async register(email, username, password, full_name = '') {
        const res = await fetch(`${API_BASE}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password, full_name })
        });
        return res.json();
    },

    // Login
    async login(email, password) {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },

    // Logout
    async logout(refreshToken) {
        const res = await fetch(`${API_BASE}/logout/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        return res.json();
    },

    // Forgot Password Flow
    async forgotPassword(email) {
        const res = await fetch(`${API_BASE}/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.json();
    },

    async verifyResetOTP(email, otp) {
        const res = await fetch(`${API_BASE}/verify-reset-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return res.json();
    },

    async resetPassword(email, otp, new_password, confirm_password) {
        const res = await fetch(`${API_BASE}/reset-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password, confirm_password })
        });
        return res.json();
    },

    // Token Refresh
    async refreshToken(refresh) {
        const res = await fetch(`${API_BASE}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });
        return res.json();
    }
};
