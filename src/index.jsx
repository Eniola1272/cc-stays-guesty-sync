import React from 'react';
import { createRoot } from 'react-dom/client';
import BookingWidget from './BookingWidget';

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Find the div that our PHP shortcode injected
    const targetElement = document.getElementById('cc-stays-react-booking');
    
    if (targetElement) {
        const root = createRoot(targetElement);
        root.render(<BookingWidget />);
    }
});