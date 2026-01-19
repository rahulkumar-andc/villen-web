import { useState, useEffect } from 'react';
import './CyberGate.css';

export default function CyberGate({ isOpen, onAnimationComplete }) {
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen !== null) {
            setAnimating(true);
            const timer = setTimeout(() => {
                setAnimating(false);
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            }, 1500); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen, onAnimationComplete]);

    if (!animating && isOpen === null) return null;

    return (
        <div className={`cyber-gate ${isOpen ? 'opening' : 'closing'}`}>
            {/* Light emission from inside */}
            <div className="gate-light"></div>

            {/* Left Door */}
            <div className="gate-door gate-left">
                <div className="door-inner">
                    <div className="door-lines">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="door-line"></div>
                        ))}
                    </div>
                    <div className="door-edge"></div>
                </div>
            </div>

            {/* Right Door */}
            <div className="gate-door gate-right">
                <div className="door-inner">
                    <div className="door-lines">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="door-line"></div>
                        ))}
                    </div>
                    <div className="door-edge"></div>
                </div>
            </div>

            {/* Center glow seam */}
            <div className="gate-seam"></div>
        </div>
    );
}
