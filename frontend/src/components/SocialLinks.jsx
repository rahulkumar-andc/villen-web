import React from 'react';
import { Github, Linkedin, Twitter, Mail, ExternalLink } from 'lucide-react';
import './SocialLinks.css';

const socialLinks = [
  {
    name: 'GitHub',
    url: 'https://github.com/villen',
    icon: Github,
    color: '#333'
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/villen',
    icon: Linkedin,
    color: '#0077b5'
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/villen',
    icon: Twitter,
    color: '#1da1f2'
  },
  {
    name: 'Email',
    url: 'mailto:contact@villen.me',
    icon: Mail,
    color: 'var(--accent-primary)'
  }
];

const SocialLinks = ({ variant = 'default' }) => {
  return (
    <div className={`social-links ${variant}`}>
      {socialLinks.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            style={{ '--social-color': link.color }}
            title={link.name}
          >
            <Icon size={20} />
            {variant === 'extended' && <span>{link.name}</span>}
            <ExternalLink size={12} className="external-icon" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;

