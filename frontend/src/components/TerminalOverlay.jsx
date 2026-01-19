import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, X } from 'lucide-react';
import './TerminalOverlay.css';
import { useAuth } from '../context/AuthContext';

export default function TerminalOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([
        { type: 'info', text: 'VILLEN_OS v2.0.4 [Secure Connection Established]' },
        { type: 'info', text: 'Type "help" for available commands.' },
    ]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const inputRef = useRef(null);
    const bottomRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const username = user ? user.username : 'guest';

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Toggle terminal on `~` (backtick)
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // Close on escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    const executeCommand = (cmd) => {
        const args = cmd.trim().split(' ');
        const command = args[0].toLowerCase();

        let response = { type: 'success', text: '' };

        switch (command) {
            case 'help':
                response.text = `Available commands:
  help      - Show this help message
  ls        - List system directories
  clear     - Clear terminal history
  whoami    - Show current user info
  matrix    - Toggle visual effects
  goto      - Navigate to page (e.g., goto /blog)
  login     - Go to login page
  date      - Show server time`;
                break;

            case 'ls':
                response.text = `Directory Listing of /root:
  drwxr-xr-x  projects/
  drwxr-xr-x  notes/
  drwxr-xr-x  blog/
  -rw-r--r--  contact.txt
  -rw-r--r--  about.md`;
                break;

            case 'clear':
                setOutput([]);
                return;

            case 'whoami':
                response.text = `User: ${username}
Role: ${user ? (user.role?.name || 'Authorized') : 'Anonymous'}
IP: 192.168.x.x (Masked)`;
                break;

            case 'goto':
                if (args[1]) {
                    navigate(args[1]);
                    response.text = `Navigating to ${args[1]}...`;
                    setIsOpen(false);
                } else {
                    response = { type: 'error', text: 'Usage: goto <path>' };
                }
                break;

            case 'login':
                navigate('/login');
                setIsOpen(false);
                return;

            case 'date':
                response.text = new Date().toString();
                break;

            case 'matrix':
                // We could toggle a class on body to add matrix rain effect
                document.body.classList.toggle('matrix-mode');
                response.text = 'Matrix mode toggled.';
                break;

            case 'sudo':
                response = { type: 'error', text: 'Permission denied: trust is earned, not given.' };
                break;

            case 'cat':
                if (args[1] === 'contact.txt') {
                    response.text = 'Email: sensitive@villen.me\nEncryption: PGP Public Key Available';
                } else if (args[1] === 'about.md') {
                    response.text = 'Villen: A cyber-sec entity specializing in offensive research.';
                } else {
                    response = { type: 'error', text: `File not found: ${args[1] || ''}` };
                }
                break;

            case '':
                return;

            default:
                response = { type: 'error', text: `Command not found: ${command}` };
        }

        setOutput(prev => [...prev, { type: 'command', text: `> ${cmd}` }, response]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setHistory(prev => [...prev, input]);
        setHistoryIndex(-1);
        executeCommand(input);
        setInput('');
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex + 1;
                if (newIndex < history.length) {
                    setHistoryIndex(newIndex);
                    setInput(history[history.length - 1 - newIndex]);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(history[history.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="terminal-overlay">
            <div className="terminal-window">
                <div className="terminal-header">
                    <div className="terminal-title">
                        <Terminal size={14} /> villen@system:~
                    </div>
                    <button className="terminal-close" onClick={() => setIsOpen(false)}>
                        <X size={14} />
                    </button>
                </div>
                <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
                    {output.map((line, i) => (
                        <div key={i} className={`terminal-line ${line.type}`}>
                            {line.text}
                        </div>
                    ))}
                    <form onSubmit={handleSubmit} className="terminal-form">
                        <span className="prompt">{username}@villen:~$</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            className="terminal-input"
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </form>
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
}
