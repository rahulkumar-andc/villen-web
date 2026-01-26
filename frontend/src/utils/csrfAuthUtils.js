/**
 * frontend/src/utils/csrfAuthUtils.js
 * 
 * CSRF protection, authentication, and file upload utilities
 */

/**
 * CSRF Token Management
 */
export const CSRFUtils = {
  /**
   * Get CSRF token from meta tag or cookie
   */
  getToken() {
    // Try meta tag first (recommended)
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (metaToken) return metaToken;

    // Fallback to cookie
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    return cookieToken || '';
  },

  /**
   * Add CSRF token to request headers
   */
  getHeaders(additionalHeaders = {}) {
    return {
      ...additionalHeaders,
      'X-CSRFToken': this.getToken(),
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
  },

  /**
   * Make authenticated fetch request with CSRF protection
   */
  async fetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: this.getHeaders(options.headers),
      credentials: 'include', // Include cookies for CSRF token
    });
  },

  /**
   * Log CSRF attempt
   */
  logCSRFAttempt(reason) {
    const logData = {
      type: 'CSRF_ATTEMPT',
      reason,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    fetch('/api/logs/security/', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(logData),
      credentials: 'include',
    }).catch(err => console.error('Failed to log CSRF attempt:', err));
  },
};

/**
 * Authentication Utilities
 */
export const AuthUtils = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token') || !!sessionStorage.getItem('auth_token');
  },

  /**
   * Get stored auth token
   */
  getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  },

  /**
   * Store auth token
   */
  setAuthToken(token, persistent = true) {
    if (persistent) {
      localStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token_expires');
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  },

  /**
   * Clear auth token
   */
  clearAuthToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_expires');
    sessionStorage.removeItem('auth_token');
  },

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    const expiresAt = localStorage.getItem('auth_token_expires');
    if (!expiresAt) return false;

    return new Date().getTime() > parseInt(expiresAt);
  },

  /**
   * Login user
   */
  async login(username, password) {
    try {
      const response = await CSRFUtils.fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      if (data.status === 'enter_mfa') {
        // MFA required
        return { mfa_required: true, session_id: data.session_id };
      }

      // Store session info
      if (data.token) {
        AuthUtils.setAuthToken(data.token);
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await CSRFUtils.fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthUtils.clearAuthToken();
      window.location.href = '/login';
    }
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    };

    const passedRequirements = Object.values(requirements).filter(r => r).length;
    const strength = passedRequirements >= 4 ? 'strong' : passedRequirements >= 3 ? 'medium' : 'weak';

    return {
      strength,
      requirements,
      message: this.getPasswordMessage(strength),
    };
  },

  /**
   * Get password strength message
   */
  getPasswordMessage(strength) {
    const messages = {
      weak: '❌ Weak - Add uppercase, numbers, and special characters',
      medium: '⚠️ Medium - Add more character variety',
      strong: '✅ Strong password',
    };

    return messages[strength] || '';
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await CSRFUtils.fetch('/api/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset request failed');
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await CSRFUtils.fetch('/api/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password reset failed');
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },

  /**
   * Verify MFA code
   */
  async verifyMFA(code, sessionId) {
    try {
      const response = await CSRFUtils.fetch('/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code,
          session_id: sessionId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Invalid MFA code');
      }

      const data = await response.json();
      
      if (data.token) {
        AuthUtils.setAuthToken(data.token);
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },
};

/**
 * File Upload Utilities
 */
export const FileUploadUtils = {
  /**
   * Validate file on client side
   */
  validateFile(file, fileType = 'image') {
    const rules = {
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
      },
      document: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'application/msword'],
        allowedExtensions: ['pdf', 'doc', 'docx'],
      },
      archive: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['application/zip'],
        allowedExtensions: ['zip', 'tar', 'gz'],
      },
    };

    const rule = rules[fileType] || rules.image;
    const errors = [];

    // Check size
    if (file.size > rule.maxSize) {
      errors.push(`File too large (max ${rule.maxSize / 1024 / 1024}MB)`);
    }

    // Check type
    if (!rule.allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}`);
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!rule.allowedExtensions.includes(ext)) {
      errors.push(`Invalid extension: .${ext}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Upload file to server
   */
  async uploadFile(file, fileType = 'image', progressCallback = null) {
    // Validate file
    const validation = this.validateFile(file, fileType);
    if (!validation.valid) {
      return {
        error: validation.errors.join(', '),
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Create request with CSRF token
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (progressCallback) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressCallback(percentComplete);
          }
        });
      }

      // Add CSRF token header
      xhr.setRequestHeader('X-CSRFToken', CSRFUtils.getToken());

      // Return promise
      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        // Send request
        const url = `/api/upload/${fileType}`;
        xhr.open('POST', url);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    } catch (error) {
      return { error: error.message };
    }
  },

  /**
   * Get allowed file types for input
   */
  getAcceptAttribute(fileType = 'image') {
    const types = {
      image: 'image/jpeg,image/png,image/gif',
      document: 'application/pdf,.doc,.docx',
      archive: 'application/zip,.tar,.gz',
    };

    return types[fileType] || types.image;
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
};

/**
 * Session Management
 */
export const SessionUtils = {
  /**
   * Set session timeout warning
   */
  startSessionTimeoutWarning(timeoutMinutes = 30, warningMinutes = 5) {
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    const timeoutTime = timeoutMinutes * 60 * 1000;

    // Show warning before timeout
    setTimeout(() => {
      const event = new CustomEvent('sessionWarning', {
        detail: { minutesRemaining: warningMinutes },
      });
      window.dispatchEvent(event);
    }, warningTime);

    // Logout when timeout expires
    setTimeout(() => {
      AuthUtils.logout();
    }, timeoutTime);
  },

  /**
   * Extend session
   */
  async extendSession() {
    try {
      const response = await CSRFUtils.fetch('/api/session/extend', {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  },

  /**
   * Check session validity
   */
  async isSessionValid() {
    try {
      const response = await CSRFUtils.fetch('/api/session/check', {
        method: 'GET',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

export default {
  CSRFUtils,
  AuthUtils,
  FileUploadUtils,
  SessionUtils,
};
