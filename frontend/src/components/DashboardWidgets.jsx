import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Eye, FileText, Activity, Server, 
  Globe, Clock, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import './DashboardWidgets.css';

// Mock analytics data
const visitData = [
  { name: 'Mon', visits: 120, unique: 80 },
  { name: 'Tue', visits: 180, unique: 120 },
  { name: 'Wed', visits: 150, unique: 100 },
  { name: 'Thu', visits: 220, unique: 150 },
  { name: 'Fri', visits: 280, unique: 180 },
  { name: 'Sat', visits: 350, unique: 220 },
  { name: 'Sun', visits: 310, unique: 200 },
];

const trafficSources = [
  { name: 'Direct', value: 45, color: '#00ff9d' },
  { name: 'GitHub', value: 25, color: '#00d4ff' },
  { name: 'Google', value: 20, color: '#8b5cf6' },
  { name: 'Other', value: 10, color: '#6b7280' },
];

const topPages = [
  { path: '/home', views: 2450, avgTime: '2:34' },
  { path: '/projects', views: 1820, avgTime: '4:12' },
  { path: '/blog/home', views: 1540, avgTime: '5:45' },
  { path: '/notes', views: 980, avgTime: '3:21' },
  { path: '/about', views: 760, avgTime: '1:58' },
];

const recentActivity = [
  { type: 'login', user: 'admin', time: '2 min ago', status: 'success' },
  { type: 'comment', user: 'ShadowHunter', time: '15 min ago', status: 'info' },
  { type: 'project', user: 'visitor', time: '32 min ago', status: 'info' },
  { type: 'login', user: 'monitor', time: '1 hour ago', status: 'success' },
  { type: 'error', user: 'system', time: '2 hours ago', status: 'warning' },
];

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <motion.div 
      className="stat-card"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="stat-icon" style={{ background: `${color}20`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
        <div className={`stat-change ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}>
          {isPositive ? <ArrowUp size={14} /> : isNeutral ? <Minus size={14} /> : <ArrowDown size={14} />}
          <span>{Math.abs(change)}%</span>
          <span className="period">vs last week</span>
        </div>
      </div>
    </motion.div>
  );
};

const VisitChart = ({ data }) => {
  return (
    <div className="widget-card chart-widget">
      <div className="widget-header">
        <h3>
          <Activity size={18} />
          Weekly Visits
        </h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="dot primary"></span>Total</span>
          <span className="legend-item"><span className="dot secondary"></span>Unique</span>
        </div>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2e29" />
            <XAxis dataKey="name" stroke="#5c6663" fontSize={12} />
            <YAxis stroke="#5c6663" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                background: '#0c1412', 
                border: '1px solid #1a2e29',
                borderRadius: '4px'
              }}
            />
            <Area type="monotone" dataKey="visits" stroke="#00ff9d" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
            <Area type="monotone" dataKey="unique" stroke="#00d4ff" fillOpacity={1} fill="url(#colorUnique)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TrafficSourcesChart = ({ data }) => {
  return (
    <div className="widget-card pie-widget">
      <div className="widget-header">
        <h3>
          <Globe size={18} />
          Traffic Sources
        </h3>
      </div>
      <div className="widget-content">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: '#0c1412', 
                border: '1px solid #1a2e29',
                borderRadius: '4px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-legend">
          {data.map((entry, index) => (
            <div key={index} className="pie-legend-item">
              <span className="color-dot" style={{ background: entry.color }}></span>
              <span className="name">{entry.name}</span>
              <span className="value">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TopPagesWidget = ({ pages }) => {
  return (
    <div className="widget-card list-widget">
      <div className="widget-header">
        <h3>
          <FileText size={18} />
          Top Pages
        </h3>
      </div>
      <div className="widget-content">
        <table className="data-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Views</th>
              <th>Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, index) => (
              <tr key={index}>
                <td className="path-cell">{page.path}</td>
                <td>{page.views.toLocaleString()}</td>
                <td className="time-cell">{page.avgTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ActivityFeedWidget = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <Users size={14} />;
      case 'comment': return <FileText size={14} />;
      case 'project': return <Eye size={14} />;
      case 'error': return <Server size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="widget-card activity-widget">
      <div className="widget-header">
        <h3>
          <Clock size={18} />
          Recent Activity
        </h3>
      </div>
      <div className="widget-content">
        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={index} className={`activity-item ${activity.status}`}>
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-action">{activity.type}</span>
              </div>
              <span className="activity-time">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardWidgets = () => {
  return (
    <div className="dashboard-widgets">
      <div className="stats-grid">
        <StatCard 
          title="Total Visits" 
          value="1,610" 
          change={12.5} 
          icon={Eye} 
          color="#00ff9d"
        />
        <StatCard 
          title="Unique Visitors" 
          value="1,050" 
          change={8.2} 
          icon={Users} 
          color="#00d4ff"
        />
        <StatCard 
          title="Page Views" 
          value="8,432" 
          change={-2.4} 
          icon={FileText} 
          color="#8b5cf6"
        />
        <StatCard 
          title="Avg. Session" 
          value="3:24" 
          change={5.1} 
          icon={Clock} 
          color="#f59e0b"
        />
      </div>

      <div className="charts-grid">
        <VisitChart data={visitData} />
        <TrafficSourcesChart data={trafficSources} />
      </div>

      <div className="bottom-grid">
        <TopPagesWidget pages={topPages} />
        <ActivityFeedWidget activities={recentActivity} />
      </div>
    </div>
  );
};

export default DashboardWidgets;

