/**
 * frontend/src/components/SecureAuthComponents.jsx
 * 
 * Secure authentication and file upload React components
 */

import React, { useState, useEffect } from 'react';
import { CSRFUtils, AuthUtils, FileUploadUtils, SessionUtils } from '../utils/csrfAuthUtils.js';

/**
 * SecureLoginForm Component
 * Handles login with CSRF protection and rate limiting
 */
export function SecureLoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    
    // Show strength indicator (not during login)
    if (pwd && pwd.length > 0) {
      const strength = AuthUtils.validatePasswordStrength(pwd);
      setPasswordStrength(strength);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await AuthUtils.login(username, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.mfa_required) {
      setMfaRequired(true);
      setSessionId(result.session_id);
      setLoading(false);
    } else if (result.success) {
      onSuccess?.();
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await AuthUtils.verifyMFA(mfaCode, sessionId);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      onSuccess?.();
    }

    setLoading(false);
  };

  if (mfaRequired) {
    return (
      <form onSubmit={handleMFASubmit} className="secure-form">
        <h2>Enter MFA Code</h2>
        <p>Enter the 6-digit code from your authenticator app</p>
        
        <input
          type="text"
          placeholder="000000"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength="6"
          required
          disabled={loading}
        />

        {error && <div className="form-error">{error}</div>}

        <button type="submit" disabled={loading || mfaCode.length !== 6}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="secure-form">
      <h2>Login</h2>

      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <label>Password (min 12 characters)</label>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={loading}
          autoComplete="current-password"
        />
        
        {passwordStrength && (
          <div className={`password-strength ${passwordStrength.strength}`}>
            <p>{passwordStrength.message}</p>
          </div>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={loading || !username || !password}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p>
        <a href="/forgot-password">Forgot password?</a>
      </p>
    </form>
  );
}

/**
 * SecureRegisterForm Component
 * Handles registration with strong password requirements
 */
export function SecureRegisterForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(AuthUtils.validatePasswordStrength(pwd));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strength = AuthUtils.validatePasswordStrength(password);
    if (strength.strength === 'weak') {
      setError('Password is too weak. ' + strength.message);
      return;
    }

    setLoading(true);

    try {
      const response = await CSRFUtils.fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Show email verification message
      alert('Registration successful! Check your email to verify your account.');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="secure-form">
      <h2>Register</h2>

      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          minLength="3"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Password (min 12 characters, mixed case, numbers, special chars)</label>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={loading}
          minLength="12"
        />
        
        {passwordStrength && (
          <div className={`password-strength ${passwordStrength.strength}`}>
            <p>{passwordStrength.message}</p>
            <ul>
              <li className={passwordStrength.requirements.minLength ? 'pass' : 'fail'}>
                ✓ At least 12 characters
              </li>
              <li className={passwordStrength.requirements.hasUppercase ? 'pass' : 'fail'}>
                ✓ Uppercase letters
              </li>
              <li className={passwordStrength.requirements.hasLowercase ? 'pass' : 'fail'}>
                ✓ Lowercase letters
              </li>
              <li className={passwordStrength.requirements.hasNumbers ? 'pass' : 'fail'}>
                ✓ Numbers
              </li>
              <li className={passwordStrength.requirements.hasSpecial ? 'pass' : 'fail'}>
                ✓ Special characters (!@#$%^&*)
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength="12"
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={loading || !username || !email || !password || !confirmPassword}>
        {loading ? 'Creating account...' : 'Register'}
      </button>

      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </form>
  );
}

/**
 * SecureFileUpload Component
 * Handles file upload with validation and progress tracking
 */
export function SecureFileUpload({ fileType = 'image', onSuccess, maxSize = null }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');

    if (selectedFile) {
      const validation = FileUploadUtils.validateFile(selectedFile, fileType);
      setValidation(validation);

      if (!validation.valid) {
        setError(validation.errors.join(', '));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!validation?.valid) {
      setError('File validation failed');
      return;
    }

    setUploading(true);
    setProgress(0);

    const result = await FileUploadUtils.uploadFile(file, fileType, (percent) => {
      setProgress(Math.round(percent));
    });

    if (result.error) {
      setError(result.error);
    } else {
      setFile(null);
      setProgress(0);
      setValidation(null);
      onSuccess?.(result);
    }

    setUploading(false);
  };

  const maxSizeText = maxSize 
    ? FileUploadUtils.formatFileSize(maxSize)
    : `${fileType === 'image' ? '5MB' : fileType === 'document' ? '10MB' : '50MB'}`;

  return (
    <form onSubmit={handleUpload} className="file-upload-form">
      <h3>Upload {fileType}</h3>

      <div className="file-input-wrapper">
        <input
          type="file"
          accept={FileUploadUtils.getAcceptAttribute(fileType)}
          onChange={handleFileSelect}
          disabled={uploading}
          id="file-input"
        />
        <label htmlFor="file-input" className="file-input-label">
          {file ? `Selected: ${file.name}` : `Choose ${fileType}...`}
        </label>
      </div>

      {file && (
        <div className="file-info">
          <p>Size: {FileUploadUtils.formatFileSize(file.size)} (max {maxSizeText})</p>
          <p>Type: {file.type}</p>
        </div>
      )}

      {validation && !validation.valid && (
        <div className="validation-errors">
          {validation.errors.map((error, index) => (
            <p key={index} className="error">✗ {error}</p>
          ))}
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {uploading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={!file || !validation?.valid || uploading}
        className="upload-btn"
      >
        {uploading ? `Uploading... ${progress}%` : 'Upload'}
      </button>
    </form>
  );
}

/**
 * PasswordResetForm Component
 * Handles password reset with secure token validation
 */
export function PasswordResetForm({ token, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(AuthUtils.validatePasswordStrength(pwd));
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strength = AuthUtils.validatePasswordStrength(password);
    if (strength.strength === 'weak') {
      setError('Password is too weak');
      return;
    }

    setLoading(true);

    const result = await AuthUtils.resetPassword(token, password);

    if (result.error) {
      setError(result.error);
    } else {
      alert('Password reset successful! You can now login with your new password.');
      onSuccess?.();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleReset} className="secure-form">
      <h2>Reset Password</h2>

      <div className="form-group">
        <label>New Password (min 12 characters)</label>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={loading}
          minLength="12"
        />
        
        {passwordStrength && (
          <div className={`password-strength ${passwordStrength.strength}`}>
            <p>{passwordStrength.message}</p>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength="12"
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={loading || !password || !confirmPassword}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

/**
 * SessionWarning Component
 * Shows warning before session timeout
 */
export function SessionWarning({ minutesRemaining = 5 }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleSessionWarning = (e) => {
      setShowWarning(true);
    };

    window.addEventListener('sessionWarning', handleSessionWarning);
    return () => window.removeEventListener('sessionWarning', handleSessionWarning);
  }, []);

  const handleExtendSession = async () => {
    const success = await SessionUtils.extendSession();
    if (success) {
      setShowWarning(false);
      alert('Session extended');
    } else {
      alert('Failed to extend session');
    }
  };

  const handleLogout = () => {
    AuthUtils.logout();
  };

  if (!showWarning) return null;

  return (
    <div className="session-warning">
      <div className="warning-content">
        <h3>⚠️ Session Expiring</h3>
        <p>Your session will expire in {minutesRemaining} minutes</p>
        
        <div className="warning-actions">
          <button onClick={handleExtendSession} className="btn-primary">
            Continue Session
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default {
  SecureLoginForm,
  SecureRegisterForm,
  SecureFileUpload,
  PasswordResetForm,
  SessionWarning,
};
