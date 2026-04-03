import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingWidget.css";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const LOCATIONS = [
  { label: "Florida", sublabel: null },
  { label: "Fort Lauderdale", sublabel: "Fort Lauderdale, Florida" },
  { label: "Wilton Manors", sublabel: "Wilton Manors, Florida" },
  { label: "Blue Ridge", sublabel: "Blue Ridge, Georgia" },
];

const Counter = ({ value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      style={{
        width: "30px", height: "30px", borderRadius: "50%",
        border: "1px solid #ccc", background: "#fff", cursor: value === 0 ? "default" : "pointer",
        fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
        opacity: value === 0 ? 0.3 : 1, lineHeight: 1,
      }}
    >−</button>
    <span style={{ fontSize: "14px", minWidth: "28px", textAlign: "center", color: "#222" }}>
      {value === 0 ? "Any" : value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      style={{
        width: "30px", height: "30px", borderRadius: "50%",
        border: "1px solid #ccc", background: "#fff", cursor: "pointer",
        fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1,
      }}
    >+</button>
  </div>
);

const SearchBar = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [location, setLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(0);
  const [pets, setPets] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setActiveSection(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const checkIn = startDate ? startDate.toISOString().split("T")[0] : "";
    const checkOut = endDate ? endDate.toISOString().split("T")[0] : "";
    const params = new URLSearchParams();
    if (location) params.append("location", location);
    if (checkIn) params.append("checkIn", checkIn);
    if (checkOut) params.append("checkOut", checkOut);
    if (guests > 0) params.append("guests", guests);
    if (pets > 0) params.append("pets", pets);
    window.location.href = `/stays?${params.toString()}`;
  };

  const fmtDate = (d) =>
    d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const dateLabel =
    startDate && endDate
      ? `${fmtDate(startDate)} – ${fmtDate(endDate)}`
      : startDate
      ? fmtDate(startDate)
      : null;
  const whoLabel = [
    guests > 0 ? `${guests} guest${guests !== 1 ? "s" : ""}` : null,
    pets > 0 ? `${pets} pet${pets !== 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const pillSection = (name) => ({
    padding: "8px 18px",
    borderRadius: "50px",
    cursor: "pointer",
    background: activeSection === name ? "#fff" : "transparent",
    boxShadow: activeSection === name ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
    transition: "all 0.15s ease",
    userSelect: "none",
  });

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        padding: "20px 0",
        position: "relative",
        zIndex: 1000,
      }}
    >
      <form onSubmit={handleSearch} style={{ position: "relative", width: "100%", maxWidth: "760px" }}>
        {/* PILL BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f2f2f2",
            borderRadius: "50px",
            border: "1px solid #ddd",
            padding: "6px",
            gap: "2px",
            height: "60px",
            boxSizing: "border-box",
          }}
        >
          {/* WHERE */}
          <div
            style={{ ...pillSection("where"), display: "flex", alignItems: "center", gap: "10px", flex: "1.4" }}
            onClick={() => setActiveSection(activeSection === "where" ? null : "where")}
          >
            <SearchIcon />
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#222" }}>Where</div>
              <div style={{ fontSize: "13px", color: location ? "#222" : "#888" }}>
                {location || "Search destinations"}
              </div>
            </div>
          </div>

          <div style={{ height: "24px", width: "1px", background: "#ccc", flexShrink: 0 }} />

          {/* WHEN */}
          <div
            style={{ ...pillSection("when"), flex: "1.2" }}
            onClick={() => setActiveSection(activeSection === "when" ? null : "when")}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#222" }}>When</div>
            <div style={{ fontSize: "13px", color: dateLabel ? "#222" : "#888" }}>
              {dateLabel || "Add dates"}
            </div>
          </div>

          <div style={{ height: "24px", width: "1px", background: "#ccc", flexShrink: 0 }} />

          {/* WHO */}
          <div
            style={{ ...pillSection("who"), flex: "1" }}
            onClick={() => setActiveSection(activeSection === "who" ? null : "who")}
          >
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#222" }}>Who</div>
            <div style={{ fontSize: "13px", color: whoLabel ? "#222" : "#888" }}>
              {whoLabel || "Add guests"}
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="submit"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "#111", color: "#fff",
              border: "none", borderRadius: "50px",
              padding: "14px 22px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px", flexShrink: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#111")}
          >
            <SearchIcon />
            Search
          </button>
        </div>

        {/* WHERE DROPDOWN */}
        {activeSection === "where" && (
          <div style={{
            position: "absolute", top: "68px", left: 0,
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: "20px", minWidth: "320px", zIndex: 200,
          }}>
            <input
              autoFocus
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search locations..."
              style={{
                width: "100%", border: "none", borderBottom: "1px solid #eee",
                outline: "none", fontSize: "15px", paddingBottom: "12px",
                marginBottom: "16px", boxSizing: "border-box", color: "#222",
              }}
            />
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#888", marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Suggested regions
            </div>
            {LOCATIONS.filter(
              (l) =>
                !locationSearch ||
                l.label.toLowerCase().includes(locationSearch.toLowerCase())
            ).map((l) => (
              <div
                key={l.label}
                onClick={() => {
                  setLocation(l.label);
                  setLocationSearch("");
                  setActiveSection("when");
                }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 8px", borderRadius: "8px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ background: "#f2f2f2", borderRadius: "8px", padding: "8px", display: "flex", flexShrink: 0 }}>
                  <PinIcon />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#222" }}>{l.label}</div>
                  {l.sublabel && <div style={{ fontSize: "12px", color: "#888" }}>{l.sublabel}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WHEN DROPDOWN */}
        {activeSection === "when" && (
          <div style={{
            position: "absolute", top: "68px", left: "50%", transform: "translateX(-50%)",
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: "20px", zIndex: 200,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" style={{ padding: "6px 16px", borderRadius: "20px", border: "1.5px solid #222", background: "#fff", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>Dates</button>
                <button type="button" style={{ padding: "6px 16px", borderRadius: "20px", border: "1px solid #ddd", background: "#f2f2f2", color: "#666", fontSize: "13px", cursor: "pointer" }}>Flexible</button>
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => setDateRange([null, null])}
                  style={{ background: "none", border: "none", color: "#666", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Clear dates
                </button>
              )}
            </div>
            <DatePicker
              selectsRange
              inline
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRange(update);
                if (update[0] && update[1]) setActiveSection("who");
              }}
              minDate={new Date()}
              monthsShown={2}
              calendarClassName="cc-search-calendar"
            />
          </div>
        )}

        {/* WHO DROPDOWN */}
        {activeSection === "who" && (
          <div style={{
            position: "absolute", top: "68px", right: 0,
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: "20px", minWidth: "300px", zIndex: 200,
          }}>
            {[
              { label: "Guests", sub: "Adults & children", value: guests, set: setGuests },
              { label: "Pets", sub: "Bringing a service animal?", value: pets, set: setPets },
            ].map(({ label, sub, value, set }, i) => (
              <div
                key={label}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 0",
                  borderBottom: i === 0 ? "1px solid #eee" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: "15px", color: "#222", fontWeight: "500" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{sub}</div>
                </div>
                <Counter value={value} onChange={set} />
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
