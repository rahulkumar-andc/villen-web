import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import './Notifications.css';

const NotificationsContext = React.createContext(null);

export const useNotifications = () => {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove after duration (unless it's persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    unreadCount,
    isOpen,
    setIsOpen
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationPanel />
      <NotificationToastContainer />
    </NotificationsContext.Provider>
  );
};

const NotificationPanel = () => {
  const { notifications, isOpen, setIsOpen, markAsRead, clearAll, unreadCount } = useNotifications();

  if (!isOpen) return null;

  return (
    <>
      <div className="notifications-overlay" onClick={() => setIsOpen(false)} />
      <motion.div 
        className="notifications-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="panel-header">
          <h2>
            <Bell size={20} />
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="panel-actions">
          {notifications.length > 0 && (
            <button onClick={clearAll} className="clear-btn">
              Clear All
            </button>
          )}
        </div>

        <div className="panel-content">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Bell size={40} />
                <p>No notifications</p>
              </motion.div>
            ) : (
              notifications.map(notification => {
                const Icon = notificationIcons[notification.type] || Info;
                return (
                  <motion.div
                    key={notification.id}
                    className={`notification-item ${notification.type} ${notification.read ? 'read' : ''}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Icon size={18} />
                    <div className="notification-content">
                      <p className="notification-title">{notification.title}</p>
                      {notification.message && (
                        <p className="notification-message">{notification.message}</p>
                      )}
                      {notification.time && (
                        <span className="notification-time">{notification.time}</span>
                      )}
                    </div>
                    <button 
                      className="dismiss-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

const NotificationToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();
  const toasts = notifications.slice(-3); // Show last 3 as toasts

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(notification => {
          const Icon = notificationIcons[notification.type] || Info;
          return (
            <motion.div
              key={notification.id}
              className={`toast ${notification.type}`}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <Icon size={18} />
              <div className="toast-content">
                <p className="toast-title">{notification.title}</p>
                {notification.message && (
                  <p className="toast-message">{notification.message}</p>
                )}
              </div>
              <button onClick={() => removeNotification(notification.id)}>
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Notification Bell Button Component
export const NotificationBell = ({ size = 24 }) => {
  const { unreadCount, setIsOpen } = useNotifications();

  return (
    <button className="notification-bell" onClick={() => setIsOpen(true)}>
      <Bell size={size} />
      {unreadCount > 0 && (
        <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </button>
  );
};

export default NotificationsProvider;

