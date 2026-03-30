import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { addMonths, subMonths, format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './AvailabilityCalendar.css';

// SVG Icons for Navigation
const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const AvailabilityCalendar = () => {
    const mountNode = document.getElementById('cc-stays-react-availability');
    // Using this to identify which listing we are fetching data for
    const listingId = mountNode ? mountNode.getAttribute('data-listing-id') : null;

    const [blockedDates, setBlockedDates] = useState([]);
    
    // For navigation, we can use React-DatePicker's renderCustomHeader
    // but the design shows arrows flanking the title "Rates & Availability" visually or above the calendars.
    // The design shows the arrows above the left and right calendars, aligned with the month names.
    // We will use renderCustomHeader for perfect alignment per month.

    useEffect(() => {
        const fetchBlockedDates = async () => {
            if (!listingId) return;

            try {
                const response = await fetch(
                    `/wp-json/cc-stays/v1/availability?listingId=${listingId}`
                );
                const data = await response.json();

                if (data.blockedDates && Array.isArray(data.blockedDates)) {
                    // Convert "YYYY-MM-DD" strings into JS Date objects
                    const dates = data.blockedDates.map((dateStr) => {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day);
                    });
                    setBlockedDates(dates);
                }
            } catch (err) {
                console.error('Failed to fetch availability:', err);
            }
        };

        fetchBlockedDates();
    }, [listingId]);

    // Force exact string format for days
    const formatWeekDay = (nameOfDay) => {
        // react-datepicker v9 passes full locale names like "Sunday", "Monday"
        const map = {
            'Sunday': 'Su',
            'Monday': 'M',
            'Tuesday': 'T',
            'Wednesday': 'W',
            'Thursday': 'Th',
            'Friday': 'F',
            'Saturday': 'Sa'
        };
        return map[nameOfDay] || nameOfDay.substring(0, 2);
    };

    const renderDayContents = (day, date) => {
        // Datepicker handles the `react-datepicker__day--disabled` class for us via `excludeDates`
        // We only need to optionally add an extra 'X' mark visually if we want.
        // We'll rely on the class but add an 'X' text that we'll style gently in CSS.
        
        const isBlocked = blockedDates.some(blocked => 
            blocked.getDate() === date.getDate() && 
            blocked.getMonth() === date.getMonth() && 
            blocked.getFullYear() === date.getFullYear()
        );

        if (isBlocked) {
            return (
                <span>
                    {day}
                    <span className="disabled-cross">X</span>
                </span>
            );
        }
        
        return day;
    };

    return (
        <div className="cc-availability-container">
            <div className="cc-availability-header">
                <h2>Rates & Availability</h2>
                <div className="cc-header-line"></div>
            </div>

            <div className="cc-calendar-wrapper">
                <DatePicker
                    inline
                    monthsShown={2}
                    excludeDates={blockedDates}
                    formatWeekDay={formatWeekDay}
                    renderDayContents={renderDayContents}
                    renderCustomHeader={({
                        monthDate,
                        customHeaderCount,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled
                    }) => (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Left Box: Show Left Arrow if it's the first month (count=0) */}
                            {customHeaderCount === 0 ? (
                                <button className="cc-nav-btn" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
                                    <ChevronLeftIcon />
                                </button>
                            ) : <div style={{width: '36px'}} />} {/* Empty space filler */}

                            <span className="react-datepicker__current-month">
                                {format(monthDate, "MMMM yyyy")}
                            </span>

                            {/* Right Box: Show Right Arrow if it's the second month (count=1) */}
                            {customHeaderCount === 1 ? (
                                <button className="cc-nav-btn" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                                    <ChevronRightIcon />
                                </button>
                            ) : <div style={{width: '36px'}} />} {/* Empty space filler */}
                        </div>
                    )}
                />
            </div>
            
            <button className="cc-show-more-btn">Show More</button>
        </div>
    );
};

export default AvailabilityCalendar;
