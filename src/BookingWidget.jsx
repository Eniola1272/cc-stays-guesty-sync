import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingWidget.css";

// Reusable Icons
const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ChevronsIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="7 15 12 20 17 15"></polyline>
    <polyline points="7 9 12 4 17 9"></polyline>
  </svg>
);

const BookingWidget = () => {
  const mountNode = document.getElementById("cc-stays-react-booking");
  const listingId = mountNode
    ? mountNode.getAttribute("data-listing-id")
    : null;

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(null);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const guestDropdownRef = useRef(null);

  // Click outside to close guest dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestDropdownRef.current &&
        !guestDropdownRef.current.contains(event.target)
      ) {
        setIsGuestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchQuote = async () => {
    if (!startDate || !endDate || !guests) {
      setError("Please select dates and guests to check availability.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);

    const formatedCheckIn = startDate.toISOString().split("T")[0];
    const formatedCheckOut = endDate.toISOString().split("T")[0];

    const payload = {
      listingId: listingId,
      checkIn: formatedCheckIn,
      checkOut: formatedCheckOut,
      guests: guests,
    };

    console.log("[CC Stays Debug] Sending quote request:", payload);

    try {
      const response = await fetch("/wp-json/cc-stays/v1/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("[CC Stays Debug] Response status:", response.status);
      console.log("[CC Stays Debug] Full response data:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "These dates are currently unavailable.",
        );
      }

      // Even on HTTP 200, check if Guesty flagged it as unavailable
      if (data.available === false) {
        setError(data.message || "These dates are not available.");
        // Still store the data so we can show debug info
        setQuote(data);
        return;
      }

      setQuote(data);
    } catch (err) {
      console.error("[CC Stays Debug] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSelect = (num) => {
    setGuests(num);
    setIsGuestDropdownOpen(false);
  };

  if (!listingId)
    return <div className="cc-booking-widget">Error: Missing Property ID</div>;

  return (
    <div className="cc-booking-widget">
      <div className="cc-booking-header">
        <h2 className="cc-booking-price-line">From $450 avg / night</h2>
        <p className="cc-booking-min-stay">Minimum stay: 2 nights</p>
      </div>

      <div className="cc-booking-inputs">
        <div className="cc-date-row">
          <div className="cc-input-group">
            <label>Check in</label>
            <div className="cc-input-wrapper">
              <span className="cc-input-icon">
                <CalendarIcon />
              </span>
              <DatePicker
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (endDate && date > endDate) setEndDate(null);
                }}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                minDate={new Date()}
                placeholderText="23/02/26"
                dateFormat="dd/MM/yy"
              />
            </div>
          </div>
          <div className="cc-input-group">
            <label>Check out</label>
            <div className="cc-input-wrapper">
              <span className="cc-input-icon">
                <CalendarIcon />
              </span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || new Date()}
                placeholderText="- - -"
                dateFormat="dd/MM/yy"
              />
            </div>
          </div>
        </div>

        <div className="cc-guest-select-container" ref={guestDropdownRef}>
          <div
            className="cc-guest-select-wrapper"
            onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
          >
            <span className="cc-input-icon">
              <UserIcon />
            </span>
            <div
              className={`cc-guest-select-value ${guests ? "selected" : ""}`}
            >
              {guests ? `${guests} Guest${guests > 1 ? "s" : ""}` : "Guest"}
            </div>
            <span className="cc-guest-select-arrows">
              <ChevronsIcon />
            </span>
          </div>

          {isGuestDropdownOpen && (
            <div className="cc-dropdown-menu">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className="cc-dropdown-item"
                  onClick={() => handleGuestSelect(num)}
                >
                  {num} {num === 1 ? "Guest" : "Guests"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        className="cc-btn-primary"
        onClick={fetchQuote}
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Availability"}
      </button>

      <div className="cc-message-area">
        {error && <div className="cc-error-message">{error}</div>}
        {loading && !error && (
          <div className="cc-loading-message">Calculating your stay...</div>
        )}
      </div>

      {quote && quote.available && !error && !loading && (
        <div className="cc-quote-summary">
          <div className="cc-price-row">
            <span>Total</span>
            <strong>${quote.totalPrice}</strong>
          </div>
          <button className="cc-btn-primary" style={{ marginTop: "10px" }}>
            Reserve Now
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;
