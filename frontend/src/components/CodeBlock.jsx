import React, { useEffect, useRef, useState, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-markdown';
import './CodeBlock.css';

// Language display names mapping
const LANGUAGE_NAMES = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  bash: 'Bash',
  shell: 'Shell',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  markup: 'HTML',
  xml: 'XML',
  sql: 'SQL',
  yaml: 'YAML',
  docker: 'Dockerfile',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  'c#': 'C#',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  markdown: 'Markdown',
  md: 'Markdown',
};

const MAX_LINES_BEFORE_EXPAND = 50;

const CodeBlock = ({ 
  code, 
  language = 'javascript', 
  showLineNumbers = true,
  title,
  showLineNumbersToggle = true,
  theme = 'tomorrow'
}) => {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbersEnabled, setShowLineNumbersEnabled] = useState(showLineNumbers);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  const lines = code.trim().split('\n');
  const isLongCode = lines.length > MAX_LINES_BEFORE_EXPAND;
  const displayLines = isExpanded ? lines : lines.slice(0, MAX_LINES_BEFORE_EXPAND);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language, selectedTheme, isExpanded]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getLanguageDisplay = () => {
    return LANGUAGE_NAMES[language.toLowerCase()] || language;
  };

  const copyButtonText = copied ? '✓ Copied!' : 'Copy';
  const expandButtonText = isExpanded ? 'Collapse' : `Expand (${lines.length} lines)`;

  return (
    <div className={`code-block-container theme-${selectedTheme}`}>
      <div className="code-block-header">
        <div className="code-header-left">
          <div className="code-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          {title && <span className="code-title">{title}</span>}
          <span className="code-language">{getLanguageDisplay()}</span>
        </div>
        <div className="code-header-actions">
          {showLineNumbersToggle && (
            <button
              className={`line-numbers-btn ${showLineNumbersEnabled ? 'active' : ''}`}
              onClick={() => setShowLineNumbersEnabled(!showLineNumbersEnabled)}
              title={`${showLineNumbersEnabled ? 'Hide' : 'Show'} line numbers`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          {isLongCode && (
            <button
              className="expand-btn"
              onClick={handleExpand}
              title={expandButtonText}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isExpanded ? (
                  <polyline points="18 15 12 9 6 15"></polyline>
                ) : (
                  <polyline points="6 9 12 15 18 9"></polyline>
                )}
              </svg>
              {isExpanded ? 'Collapse' : `+${lines.length - MAX_LINES_BEFORE_EXPAND} lines`}
            </button>
          )}
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
            {copyButtonText}
          </button>
        </div>
      </div>
      <div className={`code-block-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <pre className={`code-block ${showLineNumbersEnabled ? 'with-line-numbers' : ''}`}>
          <code ref={codeRef} className={`language-${language}`}>
            {displayLines.map((line, i) => (
              <div key={i} className="code-line">
                {showLineNumbersEnabled && (
                  <span className="line-number">{i + 1}</span>
                )}
                <span className="line-content">{line}</span>
              </div>
            ))}
            {isLongCode && !isExpanded && (
              <div className="code-line collapse-notice">
                <span className="line-content">
                  <em>... {lines.length - MAX_LINES_BEFORE_EXPAND} more lines. Click "Expand" to view all.</em>
                </span>
              </div>
            )}
          </code>
        </pre>
      </div>
      {isLongCode && isExpanded && (
        <div className="code-block-footer">
          <span className="line-count">{lines.length} lines</span>
          <button className="collapse-btn" onClick={handleExpand}>
            Collapse code
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;

