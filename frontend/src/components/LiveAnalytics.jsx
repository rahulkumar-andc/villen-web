import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Clock, MapPin, MousePointer, Eye } from 'lucide-react';
import './LiveAnalytics.css';

// Simulated live visitor data
const generateMockData = () => ({
  activeVisitors: Math.floor(Math.random() * 50) + 20,
  pageViews: Math.floor(Math.random() * 500) + 200,
  avgTime: '2:' + Math.floor(Math.random() * 60),
  locations: [
    { country: 'United States', count: 45, flag: '🇺🇸' },
    { country: 'India', count: 28, flag: '🇮🇳' },
    { country: 'Germany', count: 18, flag: '🇩🇪' },
    { country: 'United Kingdom', count: 15, flag: '🇬🇧' },
    { country: 'France', count: 12, flag: '🇫🇷' },
  ],
  topPages: [
    { path: '/home', views: 120, visitors: 80 },
    { path: '/blog/home', views: 95, visitors: 65 },
    { path: '/projects', views: 78, visitors: 52 },
    { path: '/notes', views: 56, visitors: 38 },
    { path: '/about', views: 42, visitors: 30 },
  ],
  recentActions: [
    { user: 'Visitor', action: 'Viewed /home', time: 'Just now' },
    { user: 'ShadowHunter', action: 'Commented on post', time: '1 min ago' },
    { user: 'Visitor', action: 'Viewed /projects', time: '2 min ago' },
    { user: 'Admin', action: 'Logged in', time: '3 min ago' },
  ]
});

const LiveAnalytics = ({ isAdmin = false }) => {
  const [data, setData] = useState(generateMockData());
  const [isPaused, setIsPaused] = useState(false);
  const [clickPositions, setClickPositions] = useState([]);
  const [scrollDepth, setScrollDepth] = useState(0);
  const heatmapRef = useRef(null);

  // Simulate real-time updates
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        activeVisitors: prev.activeVisitors + Math.floor(Math.random() * 5) - 2,
        pageViews: prev.pageViews + Math.floor(Math.random() * 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Track clicks for heatmap
  const handleClick = (e) => {
    if (!heatmapRef.current) return;
    const rect = heatmapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setClickPositions(prev => [...prev.slice(-49), { x, y, time: Date.now() }]);
  };

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = (scrollTop / docHeight) * 100;
      setScrollDepth(depth);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isAdmin) {
    return (
      <div className="analytics-preview">
        <div className="analytics-header">
          <Activity size={20} />
          <h3>Live Activity</h3>
        </div>
        <div className="mini-stats">
          <div className="mini-stat">
            <Users size={16} />
            <span>{data.activeVisitors} online</span>
          </div>
          <div className="mini-stat">
            <Eye size={16} />
            <span>{data.pageViews} views</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-analytics">
      <div className="analytics-header">
        <div className="header-left">
          <Activity size={24} />
          <h2>Real-Time Analytics</h2>
        </div>
        <button 
          className={`pause-btn ${isPaused ? 'active' : ''}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <motion.div 
          className="stat-card live"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.activeVisitors}</span>
            <span className="stat-label">Active Visitors</span>
          </div>
          <div className="live-indicator">
            <span className="pulse"></span>
            Live
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon">
            <Eye size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.pageViews}</span>
            <span className="stat-label">Page Views Today</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.avgTime}</span>
            <span className="stat-label">Avg. Session</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon">
            <MousePointer size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{Math.round(scrollDepth)}%</span>
            <span className="stat-label">Scroll Depth</span>
          </div>
        </motion.div>
      </div>

      <div className="analytics-columns">
        {/* Top Pages */}
        <div className="analytics-card">
          <h3>
            <Eye size={18} />
            Top Pages
          </h3>
          <div className="page-list">
            {data.topPages.map((page, i) => (
              <div key={page.path} className="page-item">
                <span className="page-rank">{i + 1}</span>
                <span className="page-path">{page.path}</span>
                <div className="page-bar">
                  <div 
                    className="page-fill" 
                    style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }}
                  ></div>
                </div>
                <span className="page-views">{page.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="analytics-card">
          <h3>
            <MapPin size={18} />
            Top Locations
          </h3>
          <div className="location-list">
            {data.locations.map((loc, i) => (
              <div key={loc.country} className="location-item">
                <span className="location-flag">{loc.flag}</span>
                <span className="location-name">{loc.country}</span>
                <span className="location-count">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-card full-width">
          <h3>
            <Clock size={18} />
            Live Feed
          </h3>
          <div className="activity-feed">
            {data.recentActions.map((action, i) => (
              <div key={i} className="feed-item">
                <span className="feed-user">{action.user}</span>
                <span className="feed-action">{action.action}</span>
                <span className="feed-time">{action.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Click Heatmap Preview */}
      <div className="analytics-card heatmap-card">
        <h3>
          <MousePointer size={18} />
          Click Heatmap (Last 50 clicks)
        </h3>
        <div 
          className="heatmap-container"
          ref={heatmapRef}
          onClick={handleClick}
        >
          <div className="heatmap-overlay">
            {clickPositions.map((pos, i) => (
              <motion.div
                key={i}
                className="heatmap-dot"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 0.5 }}
                exit={{ scale: 0 }}
              />
            ))}
          </div>
          <p className="heatmap-hint">Click anywhere to add a tracking point</p>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalytics;

