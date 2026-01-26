import React, { useState, useEffect } from 'react';
import { List, ChevronUp, ChevronDown } from 'lucide-react';
import './BlogTOC.css';

const BlogTOC = ({ headings }) => {
  const [activeId, setActiveId] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!headings || headings.length === 0) return null;

  return (
    <div className={`blog-toc ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="toc-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle table of contents"
      >
        <List size={18} />
        <span>Contents</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isExpanded && (
        <nav className="toc-content">
          <ul className="toc-list">
            {headings.map((heading) => (
              <li key={heading.id}>
                <button
                  className={`toc-link ${heading.level === 3 ? 'nested' : ''} ${activeId === heading.id ? 'active' : ''}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default BlogTOC;

