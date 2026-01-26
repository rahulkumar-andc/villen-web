import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ChevronRight, Cpu, Wifi, WifiOff } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const [terminalLines, setTerminalLines] = useState([]);
  const [isSystemDown, setIsSystemDown] = useState(false);

  const terminalOutput = [
    { text: 'ERROR: 404 - LOCATION NOT FOUND', type: 'error' },
    { text: 'Searching for requested resource...', type: 'info' },
    { text: 'Scanning sector 7G...', type: 'info' },
    { text: 'Sector 7G: NO DATA', type: 'error' },
    { text: 'Initiating deep scan protocol...', type: 'info' },
    { text: 'Deep scan result: VOID', type: 'error' },
    { text: 'SYSTEM MESSAGE: This page has been consumed by the void.', type: 'warning' },
    { text: 'Returning to main interface in 3...', type: 'info' },
    { text: 'Returning to main interface in 2...', type: 'info' },
    { text: 'Returning to main interface in 1...', type: 'info' },
    { text: 'ABORTING AUTO-REDIRECT. User detected.', type: 'info' },
    { text: 'Awaiting user input...', type: 'success' }
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < terminalOutput.length) {
        setTerminalLines(prev => [...prev, terminalOutput[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const toggleSystem = () => {
    setIsSystemDown(!isSystemDown);
  };

  return (
    <div className="not-found-container">
      <div className="not-found-terminal">
        <div className="terminal-header">
          <Terminal size={18} />
          <span>void_detected.exe</span>
          <div className="terminal-controls">
            <span className="control-dot red" />
            <span className="control-dot yellow" />
            <span className="control-dot green" />
          </div>
        </div>
        
        <div className="terminal-content">
          <div className="error-code">
            <h1 className="glitch" data-text="404">404</h1>
            <p>ENTITY NOT FOUND</p>
          </div>

          <div className="terminal-output">
            {terminalLines.map((line, index) => (
              <div key={index} className={`terminal-line ${line.type}`}>
                <span className="prompt">></span>
                {line.text}
              </div>
            ))}
            <div className="terminal-line blink">_</div>
          </div>

          {/* Easter Egg - System Toggle */}
          <div className="easter-egg-section">
            <button className="system-toggle" onClick={toggleSystem}>
              {isSystemDown ? (
                <>
                  <WifiOff size={16} /> RESTART SYSTEM
                </>
              ) : (
                <>
                  <Wifi size={16} /> SHUTDOWN SYSTEM
                </>
              )}
            </button>
            
            {isSystemDown && (
              <div className="system-down-message">
                <Cpu size={48} />
                <p>SYSTEM HALTED BY USER COMMAND</p>
                <small>The void grows stronger...</small>
              </div>
            )}
          </div>

          <div className="return-options">
            <Link to="/home" className="return-link">
              <ChevronRight size={18} /> Return to Base
            </Link>
            <Link to="/contact" className="return-link">
              <ChevronRight size={18} /> Report Anomaly
            </Link>
            <Link to="/notes" className="return-link">
              <ChevronRight size={18} /> Check Notes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

