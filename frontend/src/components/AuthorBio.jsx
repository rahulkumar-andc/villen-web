import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Github, Linkedin, Twitter, Mail } from 'lucide-react';
import SocialLinks from './SocialLinks';
import './AuthorBio.css';

const AuthorBio = ({ author }) => {
  // Default author data (VILLEN)
  const defaultAuthor = {
    name: 'VILLEN',
    role: 'Security Researcher & Developer',
    bio: 'Passionate about cybersecurity, penetration testing, and building secure systems. Creating tools that survive real-world chaos.',
    avatar: null,
    socials: {
      github: 'https://github.com/villen',
      linkedin: 'https://linkedin.com/in/villen',
      twitter: 'https://twitter.com/villen',
      email: 'mailto:contact@villen.me'
    }
  };

  const authorData = author || defaultAuthor;

  return (
    <motion.div 
      className="author-bio-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="author-avatar">
        {authorData.avatar ? (
          <img src={authorData.avatar} alt={authorData.name} />
        ) : (
          <div className="avatar-placeholder">
            <Shield size={40} />
          </div>
        )}
      </div>
      
      <div className="author-info">
        <div className="author-header">
          <h3 className="author-name">{authorData.name}</h3>
          <span className="author-role">{authorData.role}</span>
        </div>
        
        <p className="author-bio">{authorData.bio}</p>
        
        <div className="author-socials">
          <SocialLinks variant="extended" />
        </div>
      </div>
    </motion.div>
  );
};

export default AuthorBio;

