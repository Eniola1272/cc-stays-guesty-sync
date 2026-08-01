import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingWidget.css";

const PinIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#555"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const LOCATIONS = [
  { label: "Florida", sublabel: null },
  { label: "Fort Lauderdale", sublabel: "Fort Lauderdale, Florida" },
  { label: "Wilton Manors", sublabel: "Wilton Manors, Florida" },
  { label: "Blue Ridge", sublabel: "Blue Ridge, Georgia" },
];

const circleBtn = (extra = {}) => ({
  width: "32px",
  height: "32px",
  aspectRatio: "1 / 1",
  flexShrink: 0,
  borderRadius: "50%",
  border: "1px solid #bbb",
  background: "#fff",
  color: "#222",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  ...extra,
});

const Counter = ({ value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      style={circleBtn({
        cursor: value === 0 ? "default" : "pointer",
        opacity: value === 0 ? 0.3 : 1,
      })}
    >
      −
    </button>
    <span
      style={{
        fontSize: "14px",
        minWidth: "28px",
        textAlign: "center",
        color: "#222",
      }}
    >
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      style={circleBtn()}
    >
      +
    </button>
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
    d
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
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
    minHeight: "72px",
    padding: "18px 26px",
    borderRadius: "0",
    cursor: "pointer",
    background:
      activeSection === name ? "rgba(41, 41, 41, 0.035)" : "transparent",
    boxShadow: "none",
    transition: "background-color 0.18s ease",
    userSelect: "none",
    boxSizing: "border-box",
  });

  const fieldLabelStyle = {
    fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
    fontSize: "9.5px",
    fontWeight: "500",
    letterSpacing: "0.16em",
    lineHeight: 1.1,
    textTransform: "uppercase",
    color: "rgba(41,41,41,0.45)",
  };

  const fieldValueStyle = {
    marginTop: "7px",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: 1.2,
    color: "rgba(41,41,41,0.85)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

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
      <form
        onSubmit={handleSearch}
        className="cc-searchbar-form"
        style={{ position: "relative", width: "100%", maxWidth: "840px" }}
      >
        {/* SEARCH BAR */}
        <div className="cc-searchbar-pill">
          {/* WHERE */}
          <div
            className="cc-searchbar-section"
            style={{
              ...pillSection("where"),
            }}
            onClick={() =>
              setActiveSection(activeSection === "where" ? null : "where")
            }
          >
            <div
              className="cc-pill-label"
              style={fieldLabelStyle}
            >
              Where
            </div>
            <div style={fieldValueStyle}>
              {location || "Add location"}
            </div>
          </div>

          <div className="cc-searchbar-divider" />

          {/* WHEN */}
          <div
            className="cc-searchbar-section"
            style={pillSection("when")}
            onClick={() =>
              setActiveSection(activeSection === "when" ? null : "when")
            }
          >
            <div
              className="cc-pill-label"
              style={fieldLabelStyle}
            >
              When
            </div>
            <div style={fieldValueStyle}>{dateLabel || "Add dates"}</div>
          </div>

          <div className="cc-searchbar-divider" />

          {/* WHO */}
          <div
            className="cc-searchbar-section"
            style={pillSection("who")}
            onClick={() =>
              setActiveSection(activeSection === "who" ? null : "who")
            }
          >
            <div
              className="cc-pill-label"
              style={fieldLabelStyle}
            >
              Who
            </div>
            <div style={fieldValueStyle}>{whoLabel || "Add guests"}</div>
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="submit"
            className="cc-searchbar-submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#36543b",
              color: "#fafafa",
              border: "none",
              borderRadius: "0 2px 2px 0",
              padding: "0 42px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "12px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          >
            <span className="cc-searchbar-submit-text">Search</span>
          </button>
        </div>

        {/* WHERE DROPDOWN */}
        {activeSection === "where" && (
          <div
            className="cc-searchbar-dropdown cc-where-dropdown"
            style={{
              position: "absolute",
              top: "84px",
              left: 0,
              background: "#fff",
              border: "1px solid rgba(41,41,41,0.14)",
              borderRadius: "2px",
              boxShadow: "0 18px 48px rgba(41,41,41,0.12)",
              padding: "22px",
              minWidth: "320px",
              zIndex: 200,
            }}
          >
            <input
              autoFocus
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search locations..."
              style={{
                width: "100%",
                border: "none",
                borderBottom: "1px solid rgba(41,41,41,0.14)",
                outline: "none",
                fontSize: "15px",
                paddingBottom: "12px",
                marginBottom: "16px",
                boxSizing: "border-box",
                color: "#292929",
    fontFamily: '"Archivo", sans-serif',
              }}
            />
            <div
              style={{
                fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
                fontSize: "9.5px",
                fontWeight: "500",
                color: "rgba(41,41,41,0.45)",
                marginBottom: "12px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Suggested regions
            </div>
            {LOCATIONS.filter(
              (l) =>
                !locationSearch ||
                l.label.toLowerCase().includes(locationSearch.toLowerCase()),
            ).map((l) => (
              <div
                key={l.label}
                onClick={() => {
                  setLocation(l.label);
                  setLocationSearch("");
                  setActiveSection("when");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 8px",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f7f7f7")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    background: "#f2f2f2",
                    borderRadius: "2px",
                    padding: "8px",
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  <PinIcon />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#292929",
                    }}
                  >
                    {l.label}
                  </div>
                  {l.sublabel && (
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {l.sublabel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WHEN DROPDOWN */}
        {activeSection === "when" && (
          <div
            className="cc-searchbar-dropdown cc-when-dropdown"
            style={{
              position: "absolute",
              top: "84px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff",
              border: "1px solid rgba(41,41,41,0.14)",
              borderRadius: "2px",
              boxShadow: "0 18px 48px rgba(41,41,41,0.12)",
              padding: "22px",
              zIndex: 200,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="black-text"
                  style={{
                    padding: "7px 16px",
                    borderRadius: "2px",
                    border: "1px solid #292929",
                    background: "#fff",
                    fontWeight: "500",
                    fontSize: "12px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    color: "#292929",
                  }}
                >
                  Dates
                </button>
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => setDateRange([null, null])}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
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
          <div
            className="cc-searchbar-dropdown cc-who-dropdown"
            style={{
              position: "absolute",
              top: "84px",
              right: 0,
              background: "#fff",
              border: "1px solid rgba(41,41,41,0.14)",
              borderRadius: "2px",
              boxShadow: "0 18px 48px rgba(41,41,41,0.12)",
              padding: "22px",
              minWidth: "300px",
              zIndex: 200,
            }}
          >
            {[
              {
                label: "Guests",
                sub: "Adults & children",
                value: guests,
                set: setGuests,
              },
              {
                label: "Pets",
                sub: "Bringing a service animal?",
                value: pets,
                set: setPets,
              },
            ].map(({ label, sub, value, set }, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: i === 0 ? "1px solid #eee" : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#292929",
                      fontWeight: "500",
                    }}
                  >
                    {label}
                  </div>
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
