/**
 * Safe React Components for XSS Prevention
 * Ready-to-use components that implement XSS protection
 */

import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeHTML, escapeHTML, isValidURL } from '../utils/xssProtection';

/**
 * SafeHTML Component
 * Safely renders HTML content after sanitization with DOMPurify
 * @param {string} content - HTML content to render
 * @param {string} className - CSS class name
 * @param {object} config - DOMPurify configuration
 */
export const SafeHTML = ({ content, className = '', config = {} }) => {
  if (!content) {
    return <div className={className} />;
  }

  const sanitized = sanitizeHTML(content, config);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

SafeHTML.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
  config: PropTypes.object,
};

/**
 * SafeText Component
 * Safely renders text content (always escaped, never executes code)
 * @param {string} text - Text content to render
 * @param {string} className - CSS class name
 * @param {string} tag - HTML tag to use (default: div)
 */
export const SafeText = ({ text, className = '', tag: Tag = 'div', ...props }) => {
  if (!text) {
    return <Tag className={className} {...props} />;
  }

  // Text content is automatically escaped in React JSX
  return (
    <Tag className={className} {...props}>
      {String(text)}
    </Tag>
  );
};

SafeText.propTypes = {
  text: PropTypes.any,
  className: PropTypes.string,
  tag: PropTypes.string,
};

/**
 * SafeLink Component
 * Safely renders links with validated URLs
 * @param {string} href - URL to link to
 * @param {string} text - Link text (auto-escaped)
 * @param {string} title - Link title (auto-escaped)
 * @param {string} className - CSS class name
 */
export const SafeLink = ({
  href,
  text,
  title = '',
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer',
  ...props
}) => {
  // Validate URL safety
  if (!isValidURL(href)) {
    console.warn(`Invalid URL attempted: ${href}`);
    // Return safe fallback
    return <span className={className}>{text}</span>;
  }

  return (
    <a
      href={href}
      title={title} // Auto-escaped by React
      className={className}
      target={target}
      rel={rel}
      {...props}
    >
      {String(text)}
    </a>
  );
};

SafeLink.propTypes = {
  href: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
};

/**
 * SafeImage Component
 * Safely renders images with validated sources
 * @param {string} src - Image source URL
 * @param {string} alt - Alternative text (auto-escaped)
 * @param {string} className - CSS class name
 */
export const SafeImage = ({ src, alt = '', className = '', ...props }) => {
  // Only allow safe image sources
  if (!src || (!src.startsWith('/') && !src.startsWith('http'))) {
    console.warn(`Invalid image source attempted: ${src}`);
    return null;
  }

  return (
    <img
      src={src}
      alt={alt} // Auto-escaped by React
      className={className}
      {...props}
    />
  );
};

SafeImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
};

/**
 * SafeUserContent Component
 * Renders user-generated content with full protection
 * Validates input and applies multiple layers of protection
 * @param {string} content - User content to display
 * @param {boolean} allowHTML - Whether to allow HTML (default: false)
 * @param {string} className - CSS class name
 */
export const SafeUserContent = ({
  content,
  allowHTML = false,
  className = '',
  maxLength = 5000,
}) => {
  // Validate content length
  if (content && content.length > maxLength) {
    console.warn(`User content exceeds max length: ${content.length}/${maxLength}`);
    return <div className={className}>Content too long</div>;
  }

  if (!content) {
    return <div className={className} />;
  }

  // If HTML is allowed, sanitize it
  if (allowHTML) {
    const sanitized = sanitizeHTML(content);
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  // If HTML is not allowed, always escape
  return (
    <div className={className}>
      {String(content)}
    </div>
  );
};

SafeUserContent.propTypes = {
  content: PropTypes.string,
  allowHTML: PropTypes.bool,
  className: PropTypes.string,
  maxLength: PropTypes.number,
};

/**
 * SafeAttribute Component
 * Safely renders element with user-controlled attributes
 * @param {object} attributes - Attributes to apply
 * @param {string} content - Element content
 * @param {string} tag - HTML tag to use
 */
export const SafeAttribute = ({
  attributes = {},
  content,
  tag: Tag = 'div',
  className = '',
  ...props
}) => {
  // Validate and filter attributes
  const safeAttributes = {};

  Object.entries(attributes).forEach(([key, value]) => {
    // Reject dangerous attributes
    if (key.toLowerCase().startsWith('on')) {
      console.warn(`Event handler attempted: ${key}`);
      return;
    }

    // Validate href and src
    if ((key === 'href' || key === 'src') && !isValidURL(value)) {
      console.warn(`Invalid ${key} attempted: ${value}`);
      return;
    }

    safeAttributes[key] = String(value);
  });

  return (
    <Tag
      className={className}
      {...safeAttributes}
      {...props}
    >
      {String(content)}
    </Tag>
  );
};

SafeAttribute.propTypes = {
  attributes: PropTypes.object,
  content: PropTypes.string,
  tag: PropTypes.string,
  className: PropTypes.string,
};

export default {
  SafeHTML,
  SafeText,
  SafeLink,
  SafeImage,
  SafeUserContent,
  SafeAttribute,
};
