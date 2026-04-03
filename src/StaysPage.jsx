import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "react-datepicker/dist/react-datepicker.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet icon fix for Webpack
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

// --- CC STAYS ICON TOOLKIT ---

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const PersonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const FilterIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
);

const GlobeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const HouseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const StartOverIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
);

const StaysPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // Search State
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    // Fetch the property data from our new PHP endpoint
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
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // In the future, you can wire this to Guesty's availability API to filter the 'properties' array!
    alert("Search triggered! Ready to connect to filtering logic.");
  };

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Loading pristine stays...
      </div>
    );

  const mapCenter =
    properties.length > 0
      ? [properties[0].lat, properties[0].lng]
      : [26.1224, -80.1373];

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "var(--cc-font-sans)",
      }}
    >
      {/* MAIN CONTENT: Split Grid & Map */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* LEFT: Property Grid */}
        <div>
          {/* TOP BAR: Search & Filters */}
          <div style={{ marginBottom: "30px" }}>
            <form
              onSubmit={handleSearch}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                height: "48px"
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  background: "#EFECE5",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 15px",
                    borderRight: "1px solid #d4d1ca",
                  }}
                >
                  <span style={{ marginRight: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                    <CalendarIcon /> Check Availability
                  </span>
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={setDateRange}
                    placeholderText="Add dates"
                    style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: "14px" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 15px",
                    width: "100px",
                  }}
                >
                  <PersonIcon />
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    style={{ background: "transparent", width: "100%", border: "none", outline: "none", marginLeft: "10px", fontSize: "14px" }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', cursor: 'pointer', background: '#2a2725', color: '#fff', borderRadius: '4px' }}>
                  <FilterIcon /> 
              </div>
              
              <button
                type="submit"
                style={{
                  background: "#3b5240",
                  color: "#fff",
                  padding: "0 40px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  letterSpacing: "1px",
                  fontSize: "13px"
                }}
              >
                SEARCH
              </button>
            </form>

            {/* SUB BAR: Toggles */}
            {/* SUB BAR: Toggles */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "stretch",
                gap: "10px",
                height: "40px",
              }}
            >
              <button
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "1px solid #2a2725",
                  color: "#2a2725",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.5px"
                }}
              >
                <StartOverIcon /> START OVER
              </button>
              <div 
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "1px solid #2a2725",
                  color: "#2a2725",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "0.5px"
                }}
              >
                <HouseIcon /> {properties.length} Properties
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: "1px solid #2a2725",
                  color: "#2a2725",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.5px"
                }}
              >
                <GlobeIcon /> {showMap ? "HIDE MAP" : "SHOW MAP"}
              </button>
            </div>
          </div>
          <div
            style={{
              flex: showMap ? "0 0 60%" : "1",
              display: "grid",
              gridTemplateColumns: showMap
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {properties.map((prop) => (
              <div
                key={prop.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                }}
              >
                <img
                  src={prop.image}
                  alt={prop.title}
                  style={{ width: "100%", height: "220px", objectFit: "cover" }}
                />
                <div style={{ padding: "15px" }}>
                  <h3
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "18px",
                      fontFamily: "var(--cc-font-serif)",
                    }}
                  >
                    {prop.title}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    📍 {prop.city}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      fontSize: "13px",
                      color: "#444",
                      marginBottom: "15px",
                    }}
                  >
                    <span>👥 {prop.guests}</span>
                    <span>🛏️ {prop.bedrooms}</span>
                    <span>🛁 {prop.bathrooms}</span>
                  </div>
                  <a
                    href={prop.url}
                    style={{
                      display: "inline-block",
                      border: "1px solid #3b5240",
                      color: "#3b5240",
                      padding: "8px 20px",
                      textDecoration: "none",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    View Stay
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Sticky Map */}
        {showMap && (
          <div
            style={{
              flex: "0 0 40%",
              height: "800px",
              position: "sticky",
              top: "20px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {properties.map((prop) => (
                <Marker key={prop.id} position={[prop.lat, prop.lng]}>
                  <Popup>
                    <strong>{prop.title}</strong>
                    <br />${prop.price} / night
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaysPage;
