import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingWidget.css";

const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
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

const fmtDate = (d) =>
  d
    ? d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

const BookingWidget = () => {
  const mountNode = document.getElementById("cc-stays-react-booking");
  const listingId = mountNode
    ? mountNode.getAttribute("data-listing-id")
    : null;
  const nightlyRate = mountNode
    ? mountNode.getAttribute("data-nightly-rate")
    : null;
  const minNights = mountNode ? mountNode.getAttribute("data-min-nights") : "2";

  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(null);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const guestRef = useRef(null);

  // Fetch blocked/booked dates from Guesty via the existing WP endpoint
  useEffect(() => {
    if (!listingId) return;
    fetch(`/wp-json/cc-stays/v1/availability?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.blockedDates) {
          // Convert "YYYY-MM-DD" strings → Date objects for DatePicker's excludeDates
          setBlockedDates(
            data.blockedDates.map((s) => {
              const [y, m, d] = s.split("-").map(Number);
              return new Date(y, m - 1, d);
            }),
          );
        }
      })
      .catch(() => {}); // silently fail — calendar still works without block data
  }, [listingId]);

  // Close guest dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (guestRef.current && !guestRef.current.contains(e.target))
        setIsGuestOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchQuote = async () => {
    if (!startDate || !endDate || !guests) {
      setError("Please select dates and guests to check availability.");
      return;
    }
    setLoading(true);
    setError(null);
    setQuote(null);

    const payload = {
      listingId,
      checkIn: startDate.toISOString().split("T")[0],
      checkOut: endDate.toISOString().split("T")[0],
      guests,
    };

    try {
      const response = await fetch("/wp-json/cc-stays/v1/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "These dates are currently unavailable.",
        );
      if (data.available === false) {
        setError(data.message || "These dates are not available.");
        setQuote(data);
        return;
      }
      setQuote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = () => {
    const params = new URLSearchParams({
      listingId,
      checkIn: startDate.toISOString().split("T")[0],
      checkOut: endDate.toISOString().split("T")[0],
      guests,
      price: quote.totalPrice,
    });
    window.location.href = `/checkout?${params.toString()}`;
  };

  if (!listingId)
    return <div className="cc-booking-widget">Error: Missing Property ID</div>;

  return (
    <div className="cc-booking-widget">
      {/* ── Header ── */}
      <div className="cc-booking-header">
        <h2 className="cc-booking-price-line">
          {nightlyRate
            ? `From $${nightlyRate} avg / night`
            : "Check availability"}
        </h2>
        <p className="cc-booking-min-stay">
          Minimum stay: {minNights} night{minNights !== "1" ? "s" : ""}
        </p>
      </div>

      {/* ── Check-in / Check-out Boxes ── */}
      {/* <div className="cc-date-labels">
        <div className="cc-date-label-item">
          <span className="cc-date-label-title">Check-in</span>
          <div className="cc-date-label-value-row">
            <span className="cc-date-label-icon"><CalendarIcon /></span>
            <span className="cc-date-label-value">{fmtDate(startDate) || "Add date"}</span>
          </div>
        </div>
        <div className="cc-date-label-divider" />
        <div className="cc-date-label-item">
          <span className="cc-date-label-title">Check-out</span>
          <div className="cc-date-label-value-row">
            <span className="cc-date-label-icon"><CalendarIcon /></span>
            <span className="cc-date-label-value">{fmtDate(endDate) || "- - -"}</span>
          </div>
        </div>
      </div> */}

      {/* ── Inline Calendar ── */}
      <div className="cc-calendar-wrapper">
        <DatePicker
          selectsRange
          inline
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => {
            setDateRange(update);
            // Clear previous quote when dates change
            setQuote(null);
            setError(null);
          }}
          minDate={new Date()}
          excludeDates={blockedDates}
          calendarClassName="cc-search-calendar cc-widget-calendar"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            className="cc-clear-dates"
            onClick={() => {
              setDateRange([null, null]);
              setQuote(null);
              setError(null);
            }}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* ── Guest Selector ── */}
      <div className="cc-guest-select-container" ref={guestRef}>
        <div
          className="cc-guest-select-wrapper"
          onClick={() => setIsGuestOpen(!isGuestOpen)}
        >
          <span className="cc-input-icon">
            <UserIcon />
          </span>
          <div className={`cc-guest-select-value ${guests ? "selected" : ""}`}>
            {guests ? `${guests} Guest${guests > 1 ? "s" : ""}` : "Guest"}
          </div>
          <span className="cc-guest-select-arrows">
            <ChevronsIcon />
          </span>
        </div>
        {isGuestOpen && (
          <div className="cc-dropdown-menu">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="cc-dropdown-item"
                onClick={() => {
                  setGuests(num);
                  setIsGuestOpen(false);
                }}
              >
                {num} {num === 1 ? "Guest" : "Guests"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <button
        className="cc-btn-primary"
        onClick={fetchQuote}
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Availability"}
      </button>

      {/* ── Messages ── */}
      <div className="cc-message-area">
        {error && <div className="cc-error-message">{error}</div>}
        {loading && !error && (
          <div className="cc-loading-message">Calculating your stay...</div>
        )}
      </div>

      {/* ── Quote Result ── */}
      {quote && quote.available && !error && !loading && (
        <div className="cc-quote-summary">
          <div className="cc-price-row">
            <span>Total</span>
            <strong>${quote.totalPrice}</strong>
          </div>
          <button onClick={handleReserveClick} className="cc-btn-reserve">
            Reserve Now
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;
