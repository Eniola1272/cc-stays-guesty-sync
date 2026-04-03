import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingWidget.css";

// Reusing the Search Icon from the HTML provided
const SearchIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.25 20.25L16.1265 16.1265M16.1265 16.1265C17.4385 14.8145 18.25 13.002 18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.002 18.25 14.8145 17.4385 16.1265 16.1265Z"></path>
  </svg>
);

const SearchBar = () => {
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();

    const checkIn = startDate ? startDate.toISOString().split("T")[0] : "";
    const checkOut = endDate ? endDate.toISOString().split("T")[0] : "";

    const searchParams = new URLSearchParams();
    if (location) searchParams.append("location", location);
    if (checkIn) searchParams.append("checkIn", checkIn);
    if (checkOut) searchParams.append("checkOut", checkOut);
    searchParams.append("guests", guests);

    // Route directly to the Stays archive
    window.location.href = `/stays?${searchParams.toString()}`;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        padding: "20px 0",
      }}
    >
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
          borderRadius: "50px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          border: "1px solid #ebebeb",
          height: "66px",
          width: "100%",
          maxWidth: "850px",
          position: "relative",
        }}
      >
        {/* 1. WHERE */}
        <div
          style={{
            flex: "1.2",
            display: "flex",
            alignItems: "center",
            paddingLeft: "30px",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#222",
                marginBottom: "2px",
              }}
            >
              Where
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#717171",
                fontSize: "14px",
                width: "90%",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              <option value="">Search destinations</option>
              <option value="Fort Lauderdale">Fort Lauderdale, FL</option>
              <option value="Wilton Manors">Wilton Manors, FL</option>
              <option value="Blue Ridge">Blue Ridge, GA</option>
            </select>
          </div>
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: "32px",
            width: "1px",
            backgroundColor: "#ddd",
            margin: "0 10px",
          }}
        ></div>

        {/* 2. WHEN */}
        <div
          style={{
            flex: "1.5",
            display: "flex",
            alignItems: "center",
            paddingLeft: "20px",
            cursor: "pointer",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#222",
                marginBottom: "2px",
              }}
            >
              When
            </label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              minDate={new Date()}
              placeholderText="Add dates"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                cursor: "pointer",
              }}
              className="cc-minimal-datepicker"
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: "32px",
            width: "1px",
            backgroundColor: "#ddd",
            margin: "0 10px",
          }}
        ></div>

        {/* 3. WHO */}
        <div
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            paddingLeft: "20px",
            paddingRight: "120px",
            cursor: "pointer",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#222",
                marginBottom: "2px",
              }}
            >
              Who
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#717171",
                fontSize: "14px",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* SEARCH BUTTON (Absolute positioned to the right to match HTML) */}
        <button
          type="submit"
          style={{
            position: "absolute",
            right: "8px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#3b5240" /* Matching the CC Stays Green */,
            color: "#fff",
            border: "none",
            borderRadius: "50px",
            padding: "0 24px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#2c3e30")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#3b5240")}
        >
          <SearchIcon />
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
