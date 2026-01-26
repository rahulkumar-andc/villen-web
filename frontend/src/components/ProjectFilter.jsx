import React, { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import './ProjectFilter.css';

const ProjectFilter = ({ projects, onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const categories = useMemo(() => {
    const cats = new Set(projects.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [projects]);

  const statusColors = {
    'Active': 'status-green',
    'Research': 'status-yellow',
    'Coming Soon': 'status-grey',
    'Legacy': 'status-red'
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    onFilterChange(filter, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    onFilterChange(activeFilter, sort);
  };

  return (
    <div className="project-filter">
      <div className="filter-header">
        <Filter size={18} />
        <span>FILTERS</span>
      </div>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>Category</label>
          <div className="filter-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${activeFilter === category ? 'active' : ''}`}
                onClick={() => handleFilterChange(category)}
              >
                {category === 'all' ? 'ALL' : category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="date">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProjectFilter;

