import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import DatePicker from "react-datepicker";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "react-datepicker/dist/react-datepicker.css";
import "leaflet/dist/leaflet.css";
import "./StaysPage.css";
import L from "leaflet";

// ── Icons ──────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const HouseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const StartOverIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GuestIcon = () => (
  <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.00021 22C7.99992 19.6795 8.57644 17.3953 9.67792 15.3529C10.7794 13.3105 12.3713 11.5739 14.3104 10.2993C16.2495 9.02468 18.4751 8.25209 20.7868 8.05097C23.0986 7.84986 25.4241 8.22653 27.5542 9.14712C29.6843 10.0677 31.5522 11.5033 32.9898 13.3249C34.4274 15.1464 35.3897 17.2967 35.7902 19.5824C36.1906 21.8681 36.0166 24.2175 35.2838 26.4193C34.5511 28.621 33.2825 30.6061 31.5922 32.196C34.779 33.7432 37.5459 36.0358 39.6585 38.8795C41.7711 41.7232 43.1671 45.0342 43.7282 48.532C43.8519 49.3138 43.6425 50.1126 43.1481 50.7381C42.6537 51.3636 41.9178 51.7617 41.1162 51.8398C40.3147 51.918 39.5136 51.6695 38.9014 51.1517C38.2893 50.6339 37.9182 49.8925 37.8722 49.098C37.2002 45.7132 35.2799 42.2915 32.3841 39.8212C29.4882 37.3509 25.8065 35.9939 22.0002 35.9939C18.1939 35.9939 14.5122 37.3509 11.6163 39.8212C8.72048 42.2915 6.80016 45.7132 6.20021 49.472C6.00261 50.2392 5.49813 50.8953 4.80477 51.2897C4.11142 51.6841 3.28785 51.7845 2.52106 51.568C1.75427 51.3514 1.10994 50.8356 0.729065 50.1375C0.348188 49.4393 0.262289 48.617 0.49021 47.852C1.03929 44.9645 2.21459 42.2322 3.92916 39.8581C5.64374 37.484 7.85363 35.5284 10.4002 34.128C9.00889 32.8224 7.89743 31.2461 7.13718 29.4961C6.37694 27.7461 5.98386 25.8591 5.98386 23.9519C5.98386 22.0448 6.37694 20.1578 7.13718 18.4078C7.89743 16.6578 9.00889 15.0815 10.4002 13.776C11.9041 12.3649 13.7001 11.3019 15.6574 10.6677C17.6147 10.0335 19.6867 9.84422 21.7274 10.1153C23.7681 10.3863 25.7262 11.1111 27.4554 12.2363C29.1846 13.3616 30.6422 14.8598 31.7226 16.6235C32.1624 17.3495 32.2718 18.2234 32.0255 19.0329C31.7793 19.8424 31.1985 20.5184 30.4284 20.8994C29.6584 21.2803 28.7643 21.3334 27.9527 21.0459C27.1411 20.7584 26.4835 20.1553 26.142 19.38C25.5 17.9 24.1 17 22.5 17C22.0477 17.0193 21.599 17.0884 21.1602 17.2058C19.6842 17.5813 18.4132 18.514 17.6141 19.8083C16.815 21.1026 16.5495 22.6554 16.8762 24.1405C17.2029 25.6257 18.0957 26.9229 19.3613 27.7595C20.627 28.5962 22.1649 28.9071 23.6572 28.624C24.4732 28.4716 25.3107 28.6424 26.0011 29.1003C26.6916 29.5582 27.179 30.265 27.3626 31.0739C27.5461 31.8828 27.4112 32.7307 26.9861 33.4432C26.5609 34.1557 25.8791 34.6782 25.081 34.9011C23.4437 35.3687 21.7246 35.5084 20.0321 35.3118C18.3396 35.1153 16.7104 34.5866 15.2417 33.7581L15.2002 33.7334C13.7399 32.9253 12.4505 31.8448 11.4002 30.548C10.5802 29.496 9.94021 28.3067 9.48021 27.032C9.1602 26.036 8.9802 25 8.9802 23.944C8.9852 23.2967 9.03021 22.652 9.0802 22H8.00021ZM44.0002 16C46.3242 16.0016 48.5978 16.6779 50.545 17.9466C52.4922 19.2154 54.0292 21.0221 54.9695 23.1474C55.9097 25.2728 56.2128 27.6254 55.842 29.9196C55.4711 32.2139 54.4422 34.3512 52.8802 36.072C55.3163 37.2788 57.4807 38.9696 59.2414 41.0411C61.002 43.1126 62.3218 45.5213 63.1202 48.12C63.2787 48.6243 63.301 49.1615 63.1848 49.6772C63.0686 50.1929 62.8181 50.6687 62.4586 51.0562C62.099 51.4438 61.6434 51.7293 61.1379 51.8838C60.6323 52.0383 60.0949 52.0563 59.5802 51.936C59.0655 51.817 58.5915 51.5642 58.2059 51.2032C57.8203 50.8421 57.5368 50.3857 57.3842 49.88C56.6662 47.5614 55.3595 45.4686 53.5914 43.8057C51.8234 42.1427 49.6544 40.9666 47.2962 40.392C46.6411 40.2339 46.0584 39.8598 45.6419 39.3301C45.2254 38.8004 44.9993 38.1459 45.0002 37.472V36.064C44.9998 35.5055 45.1554 34.9579 45.4494 34.483C45.7434 34.0081 46.1641 33.6247 46.6642 33.376C47.8768 32.775 48.8507 31.7817 49.4275 30.5574C50.0044 29.3331 50.1504 27.9497 49.8418 26.632C49.5332 25.3142 48.7882 24.1395 47.7277 23.2986C46.6672 22.4577 45.3536 22.0001 44.0002 22C43.2045 22 42.4415 21.6839 41.8789 21.1213C41.3163 20.5587 41.0002 19.7957 41.0002 19C41.0002 18.2044 41.3163 17.4413 41.8789 16.8787C42.4415 16.3161 43.2045 16 44.0002 16Z" fill="#36543B" fillOpacity="0.7"/>
  </svg>
);

const BedroomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M56.0002 28.7467V21.3334C56.0002 16.9334 52.4002 13.3334 48.0002 13.3334H37.3335C35.2802 13.3334 33.4135 14.1334 32.0002 15.4134C30.5868 14.1334 28.7202 13.3334 26.6668 13.3334H16.0002C11.6002 13.3334 8.00016 16.9334 8.00016 21.3334V28.7467C6.3735 30.2134 5.3335 32.32 5.3335 34.6667V48C5.3335 49.4667 6.5335 50.6667 8.00016 50.6667C9.46683 50.6667 10.6668 49.4667 10.6668 48V45.3334H53.3335V48C53.3335 49.4667 54.5335 50.6667 56.0002 50.6667C57.4668 50.6667 58.6668 49.4667 58.6668 48V34.6667C58.6668 32.32 57.6268 30.2134 56.0002 28.7467ZM37.3335 18.6667H48.0002C49.4668 18.6667 50.6668 19.8667 50.6668 21.3334V26.6667H34.6668V21.3334C34.6668 19.8667 35.8668 18.6667 37.3335 18.6667ZM13.3335 21.3334C13.3335 19.8667 14.5335 18.6667 16.0002 18.6667H26.6668C28.1335 18.6667 29.3335 19.8667 29.3335 21.3334V26.6667H13.3335V21.3334ZM10.6668 40V34.6667C10.6668 33.2 11.8668 32 13.3335 32H50.6668C52.1335 32 53.3335 33.2 53.3335 34.6667V40H10.6668Z" fill="#36543B" fillOpacity="0.7"/>
  </svg>
);

const BathroomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M56.0002 37.3334V40C56.0002 45.0934 53.1468 49.52 48.9335 51.76L50.6668 58.6667H45.3335L44.0002 53.3334H20.0002L18.6668 58.6667H13.3335L15.0668 51.76C12.9319 50.6265 11.146 48.9329 9.90102 46.861C8.65601 44.7891 7.99887 42.4172 8.00016 40V37.3334H5.3335V32H53.3335V13.3334C53.3335 12.6261 53.0525 11.9479 52.5525 11.4478C52.0524 10.9477 51.3741 10.6667 50.6668 10.6667C49.3335 10.6667 48.3202 11.5734 48.0002 12.7734C49.6802 14.2134 50.6668 16.3467 50.6668 18.6667H34.6668C34.6668 16.545 35.5097 14.5101 37.01 13.0099C38.5103 11.5096 40.5451 10.6667 42.6668 10.6667H43.1202C44.2135 7.57337 47.1735 5.33337 50.6668 5.33337C52.7886 5.33337 54.8234 6.17623 56.3237 7.67652C57.824 9.17681 58.6668 11.2116 58.6668 13.3334V37.3334H56.0002ZM50.6668 37.3334H13.3335V40C13.3335 42.1218 14.1764 44.1566 15.6766 45.6569C17.1769 47.1572 19.2118 48 21.3335 48H42.6668C44.7886 48 46.8234 47.1572 48.3237 45.6569C49.824 44.1566 50.6668 42.1218 50.6668 40V37.3334Z" fill="#36543B" fillOpacity="0.7"/>
  </svg>
);

// Price pill icon for the map
const createPriceIcon = (price) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#3b5240;color:#fff;padding:5px 10px;border-radius:20px;font-size:13px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;cursor:pointer;transform:translate(-50%,-50%);display:inline-block;">$${price}</div>`,
    iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -10],
  });

const LOCATIONS = [
  { label: "Florida" },
  { label: "Fort Lauderdale", sub: "Fort Lauderdale, Florida" },
  { label: "Wilton Manors", sub: "Wilton Manors, Florida" },
  { label: "Blue Ridge", sub: "Blue Ridge, Georgia" },
];

const fmtShort = (d) => d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

const StepperRow = ({ label, sub, value, onChange }) => (
  <div className="stays-stepper-row">
    <div>
      <div className="stays-stepper-label">{label}</div>
      {sub && <div className="stays-stepper-sub">{sub}</div>}
    </div>
    <div className="stays-stepper-controls">
      <button type="button" className="stays-stepper-btn" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>−</button>
      <span className="stays-stepper-count">{value}</span>
      <button type="button" className="stays-stepper-btn" onClick={() => onChange(value + 1)}>+</button>
    </div>
  </div>
);

const StaysPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(window.innerWidth > 768);

  // Filter State
  const [locationFilter, setLocationFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(0);
  const [pets, setPets] = useState(0);

  // Desktop pill dropdown
  const [activeSection, setActiveSection] = useState(null);
  const pillRef = useRef(null);

  // Mobile drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState("where"); // where | when | who

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/wp-json/cc-stays/v1/search-stays");
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error("Error loading stays:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();

    const params = new URLSearchParams(window.location.search);
    if (params.get("location")) setLocationFilter(params.get("location"));
    if (params.get("guests")) setGuests(parseInt(params.get("guests"), 10));
    if (params.get("pets")) setPets(parseInt(params.get("pets"), 10));
    if (params.get("checkIn") && params.get("checkOut")) {
      setDateRange([new Date(params.get("checkIn")), new Date(params.get("checkOut"))]);
    }
  }, []);

  // Close desktop pill dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (pillRef.current && !pillRef.current.contains(e.target))
        setActiveSection(null);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  const filteredProperties = properties.filter((prop) => {
    if (locationFilter && !prop.city.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (guests > 0 && prop.guests < guests) return false;
    if (pets > 0 && prop.pets !== undefined && prop.pets < pets) return false;
    return true;
  });

  const handleReset = () => {
    setLocationFilter("");
    setLocationSearch("");
    setDateRange([null, null]);
    setGuests(0);
    setPets(0);
    window.history.replaceState({}, "", window.location.pathname);
    fetch("/wp-json/cc-stays/v1/search-stays")
      .then((r) => r.json())
      .then(setProperties)
      .catch((err) => console.error("Error reloading stays:", err));
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (locationFilter) params.append("location", locationFilter);
    if (startDate) params.append("checkIn", startDate.toISOString().split("T")[0]);
    if (endDate) params.append("checkOut", endDate.toISOString().split("T")[0]);
    if (guests > 0) params.append("guests", guests);
    if (pets > 0) params.append("pets", pets);

    setLoading(true);
    setActiveSection(null);
    setIsDrawerOpen(false);

    fetch(`/wp-json/cc-stays/v1/search-stays?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setProperties(data); setLoading(false); })
      .catch((err) => { console.error("Error searching stays:", err); setLoading(false); });
  };

  const toggleSection = (name) => setActiveSection((s) => s === name ? null : name);

  // Labels for pill / bar summary
  const dateLabel = startDate && endDate
    ? `${fmtShort(startDate)} – ${fmtShort(endDate)}`
    : startDate ? fmtShort(startDate) : null;
  const whoLabel = [
    guests > 0 ? `${guests} guest${guests !== 1 ? "s" : ""}` : null,
    pets > 0 ? `${pets} pet${pets !== 1 ? "s" : ""}` : null,
  ].filter(Boolean).join(", ");

  const barSummary = [locationFilter, dateLabel, whoLabel].filter(Boolean).join(" · ");

  if (loading)
    return <div style={{ padding: "50px", textAlign: "center" }}>Loading pristine stays...</div>;

  const mapCenter = filteredProperties.length > 0
    ? [filteredProperties[0].lat, filteredProperties[0].lng]
    : [26.1224, -80.1373];

  return (
    <>
      <div className="stays-page">
        {/* ── Desktop: Pill Search Bar ── */}
        <div className="stays-pill-wrapper" ref={pillRef}>
          <form onSubmit={handleSearch} className="stays-pill-bar">
            {/* Where */}
            <div
              className={`stays-pill-section ${activeSection === "where" ? "active" : ""}`}
              onClick={() => toggleSection("where")}
            >
              <SearchIcon />
              <div className="stays-pill-text">
                <span className="stays-pill-label">Where</span>
                {locationFilter && <span className="stays-pill-value">{locationFilter}</span>}
              </div>
            </div>

            <div className="stays-pill-divider" />

            {/* When */}
            <div
              className={`stays-pill-section ${activeSection === "when" ? "active" : ""}`}
              onClick={() => toggleSection("when")}
            >
              <CalendarIcon />
              <div className="stays-pill-text">
                <span className="stays-pill-label">When</span>
                {dateLabel && <span className="stays-pill-value">{dateLabel}</span>}
              </div>
            </div>

            <div className="stays-pill-divider" />

            {/* Who */}
            <div
              className={`stays-pill-section ${activeSection === "who" ? "active" : ""}`}
              onClick={() => toggleSection("who")}
            >
              <div className="stays-pill-text">
                <span className="stays-pill-label">Who</span>
                {whoLabel && <span className="stays-pill-value">{whoLabel}</span>}
              </div>
            </div>

            <button type="submit" className="stays-pill-search-btn">
              <SearchIcon />
              <span>Search</span>
            </button>
          </form>

          {/* Where dropdown */}
          {activeSection === "where" && (
            <div className="stays-pill-dropdown stays-pill-dropdown--left">
              <input
                autoFocus
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search destinations…"
                className="stays-dropdown-search"
              />
              <div className="stays-dropdown-section-label">Suggested regions</div>
              {LOCATIONS.filter(
                (l) => !locationSearch || l.label.toLowerCase().includes(locationSearch.toLowerCase())
              ).map((l) => (
                <div key={l.label} className="stays-dropdown-location-item"
                  onClick={() => { setLocationFilter(l.label); setLocationSearch(""); setActiveSection("when"); }}>
                  <div className="stays-dropdown-pin"><PinIcon /></div>
                  <div>
                    <div className="stays-dropdown-location-name">{l.label}</div>
                    {l.sub && <div className="stays-dropdown-location-sub">{l.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* When dropdown */}
          {activeSection === "when" && (
            <div className="stays-pill-dropdown stays-pill-dropdown--center">
              <div className="stays-dropdown-cal-header">
                {(startDate || endDate) && (
                  <button type="button" className="stays-dropdown-clear" onClick={() => setDateRange([null, null])}>
                    Clear dates
                  </button>
                )}
              </div>
              <DatePicker
                selectsRange inline
                startDate={startDate} endDate={endDate}
                onChange={(update) => { setDateRange(update); if (update[0] && update[1]) setActiveSection("who"); }}
                minDate={new Date()}
                monthsShown={2}
                calendarClassName="cc-search-calendar"
              />
            </div>
          )}

          {/* Who dropdown */}
          {activeSection === "who" && (
            <div className="stays-pill-dropdown stays-pill-dropdown--right">
              <StepperRow label="Guests" sub="Adults & children" value={guests} onChange={setGuests} />
              <div className="stays-stepper-divider" />
              <StepperRow label="Pets" sub="Bringing a furry friend?" value={pets} onChange={setPets} />
              <button type="button" className="stays-dropdown-done" onClick={() => setActiveSection(null)}>Done</button>
            </div>
          )}
        </div>

        {/* ── Sub-bar ── */}
        <div className="stays-subbar">
          <button onClick={handleReset} className="stays-subbar-btn">
            <StartOverIcon /> START OVER
          </button>
          <div className="stays-subbar-count">
            <HouseIcon /> {filteredProperties.length} Properties
          </div>
          <button onClick={() => setShowMap(!showMap)} className="stays-subbar-btn">
            <GlobeIcon /> {showMap ? "HIDE MAP" : "SHOW MAP"}
          </button>
        </div>

        {/* ── Main layout ── */}
        <div className="stays-layout">
          {/* LEFT: Property Grid */}
          <div className="stays-left">
            <div
              className={showMap ? "stays-grid stays-grid--with-map" : "stays-grid stays-grid--full"}
              style={{
                display: "grid",
                gridTemplateColumns: showMap ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                gap: "20px",
              }}
            >
              {filteredProperties.map((prop) => (
                <div className="stays-card" key={prop.id}>
                  <img src={prop.image} alt={prop.title} className="stays-card-img" />
                  <div className="stays-card-body">
                    <h3 className="stays-card-title">{prop.title}</h3>
                    <p className="stays-card-location">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {prop.city}
                    </p>
                    {prop.description && <p className="stays-card-desc">{prop.description}</p>}
                    <div className="stays-card-stats">
                      <span><GuestIcon /> {prop.guests}</span>
                      <span><BedroomIcon /> {prop.bedrooms}</span>
                      <span><BathroomIcon /> {prop.bathrooms}</span>
                    </div>
                    <a href={prop.url} className="stays-card-btn">
                      VIEW STAYS
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Sticky Map */}
          {showMap && (
            <div className="stays-map" style={{ flex: "0 0 40%", height: "800px", position: "sticky", top: "20px", borderRadius: "8px", overflow: "hidden" }}>
              <MapContainer center={mapCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredProperties.map((prop) => (
                  <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={createPriceIcon(prop.price)}>
                    <Popup minWidth={220}>
                      <div style={{ fontFamily: "sans-serif" }}>
                        <img src={prop.image} alt={prop.title} style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "4px", marginBottom: "10px" }} />
                        <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>{prop.title}</strong>
                        <span style={{ fontSize: "13px", color: "#666" }}>📍 {prop.city}</span>
                        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#444", margin: "8px 0" }}>
                          <span>🛏️ {prop.bedrooms} bed</span>
                          <span>🛁 {prop.bathrooms} bath</span>
                          <span>👥 {prop.guests} guests</span>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                          ${prop.price} <span style={{ fontWeight: "normal", color: "#888" }}>/ night</span>
                        </div>
                        <a href={prop.url} style={{ display: "block", textAlign: "center", background: "#3b5240", color: "#fff", padding: "8px", borderRadius: "4px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>View Stay →</a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: fixed bottom bar + drawer (portal) ── */}
      {ReactDOM.createPortal(
        <>
          {/* Fixed bar */}
          <div className="stays-mobile-bar">
            <button type="button" className="stays-mobile-bar-info" onClick={() => setIsDrawerOpen(true)}>
              <span className="stays-mobile-bar-label">{barSummary || "Search stays"}</span>
              <span className="stays-mobile-bar-sub">{filteredProperties.length} properties available</span>
            </button>
            <button type="button" className="stays-mobile-bar-btn" onClick={() => setIsDrawerOpen(true)}>
              <SearchIcon /> Search
            </button>
          </div>

          {/* Backdrop */}
          {isDrawerOpen && <div className="stays-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />}

          {/* Slide-up drawer */}
          <div className={`stays-mobile-drawer ${isDrawerOpen ? "stays-mobile-drawer--open" : ""}`} role="dialog" aria-modal="true">
            {/* Handle + close */}
            <div className="stays-drawer-handle-row">
              <div className="stays-drawer-handle" />
              <button className="stays-drawer-close" onClick={() => setIsDrawerOpen(false)} aria-label="Close"><CloseIcon /></button>
            </div>

            <div className="stays-drawer-body">
              {/* Tab switcher */}
              <div className="stays-drawer-tabs">
                {["where", "when", "who"].map((tab) => (
                  <button key={tab} type="button"
                    className={`stays-drawer-tab ${drawerSection === tab ? "active" : ""}`}
                    onClick={() => setDrawerSection(tab)}>
                    {tab === "where" ? "Where" : tab === "when" ? "When" : "Who"}
                  </button>
                ))}
              </div>

              {/* Where */}
              {drawerSection === "where" && (
                <div className="stays-drawer-section">
                  <input
                    autoFocus
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search destinations…"
                    className="stays-drawer-search-input"
                  />
                  <div className="stays-dropdown-section-label">Suggested regions</div>
                  {LOCATIONS.filter(
                    (l) => !locationSearch || l.label.toLowerCase().includes(locationSearch.toLowerCase())
                  ).map((l) => (
                    <div key={l.label} className="stays-dropdown-location-item"
                      onClick={() => { setLocationFilter(l.label); setLocationSearch(""); setDrawerSection("when"); }}>
                      <div className="stays-dropdown-pin"><PinIcon /></div>
                      <div>
                        <div className="stays-dropdown-location-name">{l.label}</div>
                        {l.sub && <div className="stays-dropdown-location-sub">{l.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* When */}
              {drawerSection === "when" && (
                <div className="stays-drawer-section">
                  {(startDate || endDate) && (
                    <button type="button" className="stays-dropdown-clear" onClick={() => setDateRange([null, null])}>Clear dates</button>
                  )}
                  <DatePicker
                    selectsRange inline
                    startDate={startDate} endDate={endDate}
                    onChange={(update) => { setDateRange(update); if (update[0] && update[1]) setDrawerSection("who"); }}
                    minDate={new Date()}
                    calendarClassName="cc-search-calendar cc-widget-calendar"
                  />
                </div>
              )}

              {/* Who */}
              {drawerSection === "who" && (
                <div className="stays-drawer-section">
                  <StepperRow label="Guests" sub="Adults & children" value={guests} onChange={setGuests} />
                  <div className="stays-stepper-divider" />
                  <StepperRow label="Pets" sub="Bringing a furry friend?" value={pets} onChange={setPets} />
                </div>
              )}

              {/* Search CTA */}
              <button type="button" className="stays-drawer-search-btn" onClick={handleSearch}>
                <SearchIcon /> Search {locationFilter ? `in ${locationFilter}` : "all stays"}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default StaysPage;
