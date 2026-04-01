import React, { useState } from 'react';
import DatePicker from 'react-datepicker'; // You already have this from the booking widget!
import 'react-datepicker/dist/react-datepicker.css';
import './BookingWidget.css'; // Reusing your existing styles

const SearchBar = () => {
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [guests, setGuests] = useState(1);

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Format dates to YYYY-MM-DD for the URL
        const checkIn = startDate ? startDate.toISOString().split('T')[0] : '';
        const checkOut = endDate ? endDate.toISOString().split('T')[0] : '';
        
        // Build the URL search parameters
        const searchParams = new URLSearchParams();
        if (checkIn) searchParams.append('checkIn', checkIn);
        if (checkOut) searchParams.append('checkOut', checkOut);
        searchParams.append('guests', guests);

        // Redirect to your main properties page with the filters applied
        window.location.href = `/properties?${searchParams.toString()}`;
    };

    return (
        <div className="cc-global-search-container" style={{ 
            background: '#fff', 
            padding: '10px 20px', 
            borderRadius: '50px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            display: 'inline-block',
            width: '100%',
            maxWidth: '900px'
        }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                
                {/* 1. WHEN (Dates) */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: '2', minWidth: '250px', borderRight: '1px solid #eee', paddingRight: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--cc-text-dark)', marginBottom: '5px' }}>
                        When
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M 2,3 2,17 18,17 18,3 2,3 Z M 17,16 3,16 3,8 17,8 17,16 Z M 17,7 3,7 3,4 17,4 17,7 Z"></path>
                            <rect width="1" height="3" x="6" y="2"></rect><rect width="1" height="3" x="13" y="2"></rect>
                        </svg>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            minDate={new Date()}
                            placeholderText="Add dates"
                            className="cc-search-input"
                            style={{ border: 'none', outline: 'none', width: '100%', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* 2. WHO (Guests) */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minWidth: '150px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--cc-text-dark)', marginBottom: '5px' }}>
                        Guests
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="9.9" cy="6.4" r="4.4"></circle>
                            <path d="M1.5,19 C2.3,14.5 5.8,11.2 10,11.2 C14.2,11.2 17.7,14.6 18.5,19.2"></path>
                        </svg>
                        <input 
                            type="number" 
                            min="1" 
                            max="20" 
                            value={guests} 
                            onChange={(e) => setGuests(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px' }}
                        />
                    </div>
                </div>

                {/* 3. SUBMIT BUTTON */}
                <div style={{ flex: '0' }}>
                    <button type="submit" className="cc-btn-primary" style={{ borderRadius: '50px', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        Search
                    </button>
                </div>

            </form>
        </div>
    );
};

export default SearchBar;
