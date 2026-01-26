import React, { useEffect, useState } from 'react';
import { Terminal, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ServerError.css';

const ServerError = () => {
  const [glitchText, setGlitchText] = useState('SYSTEM ERROR');

  useEffect(() => {
    const texts = ['SYSTEM ERROR', 'CRITICAL FAILURE', 'SYSTEM COMPROMISED', 'ERROR 500'];
    let index = 0;
    const interval = setInterval(() => {
      setGlitchText(texts[index]);
      index = (index + 1) % texts.length;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="error-container error-500">
      <div className="error-content">
        <div className="error-terminal">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="close"></span>
              <span className="minimize"></span>
              <span className="maximize"></span>
            </div>
            <span className="terminal-title">error.log</span>
          </div>
          
          <div className="terminal-body">
            <div className="log-line error">
              <span className="timestamp">[ERROR]</span>
              <span className="message">Unhandled exception in main process</span>
            </div>
            <div className="log-line">
              <span className="timestamp">[FATAL]</span>
              <span className="message">Server encountered critical error</span>
            </div>
            <div className="log-line">
              <span className="timestamp">[INFO]</span>
              <span className="message">Stack trace: 0x8F4A2B...</span>
            </div>
            <div className="log-line warning">
              <span className="timestamp">[WARNING]</span>
              <span className="message">Memory leak detected in module 7</span>
            </div>
            <div className="log-line">
              <span className="timestamp">[CRITICAL]</span>
              <span className="message">Emergency shutdown initiated</span>
            </div>
            
            <div className="cursor-line">
              <span className="prompt">root@shadowlayer:~# </span>
              <span className="cursor">_</span>
            </div>
          </div>
        </div>

        <div className="error-info">
          <div className={`glitch-container ${glitchText === 'SYSTEM ERROR' ? 'active' : ''}`}>
            <h1 className="glitch" data-text={glitchText}>{glitchText}</h1>
          </div>
          
          <p className="error-description">
            The server has encountered an unexpected condition.
            Our security systems have contained the issue.
          </p>

          <div className="error-actions">
            <button className="btn-error" onClick={handleReload}>
              <RefreshCw size={18} />
              Retry Connection
            </button>
            <button className="btn-error primary" onClick={handleGoHome}>
              <Home size={18} />
              Return to Surface
            </button>
          </div>

          <div className="error-details">
            <div className="detail-item">
              <span className="label">Error Code:</span>
              <span className="value">500-INTERNAL-SERVER-ERROR</span>
            </div>
            <div className="detail-item">
              <span className="label">Timestamp:</span>
              <span className="value">{new Date().toISOString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className="value critical">CRITICAL</span>
            </div>
          </div>

          <div className="easter-egg">
            <p>At least it's not a 403... 😅</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerError;

