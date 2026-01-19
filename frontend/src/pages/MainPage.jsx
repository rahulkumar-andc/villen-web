import React from 'react';
import LandingPage from './LandingPage';
import { HomePage } from './HomePage';

export const MainPage = () => {
    return (
        <div id="main-content">
            <section id="landing-section">
                <LandingPage />
            </section>
            <section id="home-section">
                <HomePage />
            </section>
        </div>
    );
};
