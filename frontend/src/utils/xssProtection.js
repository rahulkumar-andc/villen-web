/**
 * XSS Protection utilities for frontend
 * Provides functions to prevent Cross-Site Scripting attacks in React
 */

/**
 * Sanitize HTML content using DOMPurify
 * @param {string} dirtyHTML - Raw HTML content
 * @param {object} config - DOMPurify configuration (optional)
 * @returns {string} - Sanitized HTML safe for display
 */
export const sanitizeHTML = (dirtyHTML, config = {}) => {
  // Check if DOMPurify is available
  if (typeof window !== 'undefined' && window.DOMPurify) {
    const defaultConfig = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      KEEP_CONTENT: true,
    };
    
    return window.DOMPurify.sanitize(dirtyHTML, { ...defaultConfig, ...config });
  }
  
  // Fallback: escape HTML
  return escapeHTML(dirtyHTML);
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
export const escapeHTML = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return (text || '').replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Detect dangerous HTML patterns
 * @param {string} html - HTML to check
 * @returns {boolean} - True if dangerous patterns detected
 */
export const isDangerousHTML = (html) => {
  if (!html) return false;
  
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return dangerousPatterns.some((pattern) => pattern.test(html));
};

/**
 * Validate URL for safe protocols
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
export const isValidURL = (url) => {
  if (!url) return false;
  
  const lowerUrl = url.trim().toLowerCase();
  
  // Allow safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/'];
  const isSafeProtocol = safeProtocols.some((protocol) => lowerUrl.startsWith(protocol));
  
  if (!isSafeProtocol) return false;
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'data:text/html',
    'data:application/javascript',
    'file:',
  ];
  
  const isDangerous = dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol));
  
  return !isDangerous;
};

/**
 * Sanitize and validate user input
 * @param {string} input - User input to validate
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @param {object} options - Additional options
 * @returns {string} - Sanitized input
 * @throws {Error} - If input is unsafe
 */
export const sanitizeUserInput = (input, maxLength = 5000, options = {}) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  const { allowNewlines = true, allowHTML = false } = options;
  
  // Check length
  if (input.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }
  
  let sanitized = input.trim();
  
  // Check for dangerous patterns
  if (isDangerousHTML(sanitized)) {
    throw new Error('Input contains dangerous content');
  }
  
  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }
  
  // Escape HTML if not allowed
  if (!allowHTML) {
    sanitized = escapeHTML(sanitized);
  }
  
  return sanitized;
};

/**
 * Create a safe snippet from HTML (truncated and escaped)
 * @param {string} html - Raw HTML
 * @param {number} length - Maximum snippet length
 * @returns {string} - Safe HTML snippet
 */
export const getSafeSnippet = (html, length = 200) => {
  if (!html) return '';
  
  let snippet = html.substring(0, length);
  
  // Escape the snippet
  snippet = escapeHTML(snippet);
  
  // Add ellipsis if truncated
  if (html.length > length) {
    snippet += '...';
  }
  
  return snippet;
};

/**
 * Validate and parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @returns {object} - Parsed JSON object
 * @throws {Error} - If JSON is invalid
 */
export const parseJSONSafely = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Don't allow code execution through JSON
    if (typeof parsed === 'string' && isDangerousHTML(parsed)) {
      throw new Error('JSON contains dangerous content');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
};

/**
 * Log XSS attempts (send to backend)
 * @param {string} patternDetected - Description of dangerous pattern
 * @param {object} context - Additional context
 */
export const logXSSAttempt = (patternDetected, context = {}) => {
  const logData = {
    type: 'XSS_ATTEMPT',
    pattern: patternDetected,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  // Send to backend logging endpoint
  if (process.env.REACT_APP_API_URL) {
    fetch(`${process.env.REACT_APP_API_URL}/api/logs/security/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch((err) => console.error('Failed to log XSS attempt:', err));
  }
};

/**
 * Safe object property access (prevent prototype pollution)
 * @param {object} obj - Object to access
 * @param {string} path - Property path (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} - Property value
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return defaultValue;
    }
    
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
};

/**
 * Encode string for CSV (prevent formula injection)
 * @param {string} value - Value to encode
 * @returns {string} - CSV-safe value
 */
export const encodeCSVValue = (value) => {
  if (!value) return '';
  
  const stringValue = String(value);
  
  // Check for formula injection attempts
  if (stringValue.match(/^[=+\-@]/)) {
    // Prepend single quote to prevent formula interpretation
    return `'${stringValue}`;
  }
  
  // Escape double quotes
  if (stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

export default {
  sanitizeHTML,
  escapeHTML,
  isDangerousHTML,
  isValidURL,
  sanitizeUserInput,
  getSafeSnippet,
  parseJSONSafely,
  logXSSAttempt,
  safeGet,
  encodeCSVValue,
};
