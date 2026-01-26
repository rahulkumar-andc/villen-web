import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Link2, Twitter, Linkedin, Facebook, Mail, Check } from 'lucide-react';
import './ShareButtons.css';

const ShareButtons = ({ 
  title, 
  url = window.location.href, 
  description,
  size = 'medium',
  showLabels = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title || document.title,
    url: url,
    text: description || ''
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      getUrl: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: '#0A66C2',
      getUrl: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      getUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: '#EA4335',
      getUrl: () => `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sizeClasses = {
    small: 'share-btn-sm',
    medium: 'share-btn-md',
    large: 'share-btn-lg'
  };

  return (
    <div className={`share-buttons ${sizeClasses[size]}`}>
      <motion.button
        className="share-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Share"
      >
        <Share2 size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
        {showLabels && <span>Share</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="share-popup"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="share-header">
              <h4>Share Intelligence</h4>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="share-options">
              {shareLinks.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.a
                    key={option.name}
                    href={option.getUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-option"
                    style={{ '--share-color': option.color }}
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="option-icon">
                      <Icon size={size === 'small' ? 16 : 20} />
                    </div>
                    {showLabels && <span>{option.name}</span>}
                  </motion.a>
                );
              })}
            </div>

            <div className="share-copy">
              <div className="copy-input">
                <Link2 size={14} />
                <input type="text" value={shareData.url} readOnly />
              </div>
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButtons;

