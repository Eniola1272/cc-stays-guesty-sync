import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // The default CSS we will override later

const BookingWidget = () => {
    // 1. Grab the Guesty ID from the Elementor DOM
    const mountNode = document.getElementById('cc-stays-react-booking');
    const listingId = mountNode ? mountNode.getAttribute('data-listing-id') : null;

    // 2. State Management
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [guests, setGuests] = useState(1);
    
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 3. The Fetch Engine
    useEffect(() => {
        const fetchQuote = async () => {
            // Only fetch if both dates are selected
            if (!startDate || !endDate) return;
            
            setLoading(true);
            setError(null);

            // Format dates to YYYY-MM-DD for Guesty
            const formattedCheckIn = startDate.toISOString().split('T')[0];
            const formattedCheckOut = endDate.toISOString().split('T')[0];

            try {
                const response = await fetch('/wp-json/cc-stays/v1/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listingId: listingId,
                        checkIn: formattedCheckIn,
                        checkOut: formattedCheckOut,
                        guests: guests
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'These dates are currently unavailable.');
                }

                setQuote(data);
            } catch (err) {
                setError(err.message);
                setQuote(null);
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, [startDate, endDate, guests, listingId]);

    // 4. The UI Render
    if (!listingId) return <div className="booking-error">Integration Error: Missing Property ID</div>;

    return (
        <div className="cc-booking-widget">
            <h3>Select your dates</h3>
            
            <div className="date-picker-wrapper">
                <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    minDate={new Date()}
                    placeholderText="Check-in - Check-out"
                    className="cc-date-input"
                />
            </div>

            <div className="guest-selector">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                </select>
            </div>

            {loading && <div className="loading-spinner">Calculating your stay...</div>}
            
            {error && <div className="error-message">{error}</div>}
            
            {quote && quote.available && (
                <div className="quote-summary">
                    <div className="price-row">
                        <span>Total ({quote.currency})</span>
                        <strong>${quote.totalPrice}</strong>
                    </div>
                    <button className="cc-btn-primary">Reserve Now</button>
                </div>
            )}
        </div>
    );
};

export default BookingWidget;