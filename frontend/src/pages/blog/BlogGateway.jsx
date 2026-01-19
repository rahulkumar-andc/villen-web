import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CyberGate from '../../components/CyberGate';
import './Blog.css';

export default function BlogGateway() {
    const [entering, setEntering] = useState(false);
    const navigate = useNavigate();

    const handleEnter = () => {
        setEntering(true);
    };

    const handleGateComplete = () => {
        navigate('/blog/home');
    };

    return (
        <div className="blog-gateway">
            {/* Gate Animation */}
            {entering && (
                <CyberGate isOpen={true} onAnimationComplete={handleGateComplete} />
            )}

            {/* Background Effects */}
            <div className="gateway-bg"></div>
            <div className="gateway-grid"></div>

            {/* Content */}
            <div className="gateway-content">
                <h1 className="gateway-logo">
                    VILLEN<span>_</span>LOGS
                </h1>
                <p className="gateway-tagline">
                    Thoughts • Code • Shadows
                </p>
                <button className="gateway-btn" onClick={handleEnter}>
                    ENTER LOGS
                </button>
            </div>
        </div>
    );
}
