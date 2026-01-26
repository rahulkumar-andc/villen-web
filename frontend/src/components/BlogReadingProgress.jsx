import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';
import './BlogReadingProgress.css';

const BlogReadingProgress = ({ title, estimatedTime, contentRef }) => {
  const { scrollYProgress } = useScroll({
    target: contentRef || undefined,
    offset: ["start start", "end end"]
  });
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [readTime, setReadTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setReadTime(prev => prev + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="reading-progress-container">
      <motion.div
        className="reading-progress-bar"
        style={{ scaleX }}
      />
      <div className="reading-meta">
        <span className="reading-title">{title}</span>
        <div className="reading-stats">
          <span className="stat">
            <Clock size={14} />
            {readTime} min read
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogReadingProgress;

