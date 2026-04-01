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
                background: "#fff",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  borderRight: "1px solid #ddd",
                  paddingRight: "10px",
                }}
              >
                <span style={{ marginRight: "10px" }}>
                  📅 Check Availability
                </span>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={setDateRange}
                  placeholderText="Add dates"
                  style={{ border: "none", outline: "none" }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRight: "1px solid #ddd",
                  padding: "0 15px",
                }}
              >
                <span>👤</span>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  style={{ width: "40px", border: "none", marginLeft: "5px" }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: "#3b5240",
                  color: "#fff",
                  padding: "10px 30px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                SEARCH
              </button>
            </form>

            {/* SUB BAR: Toggles */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "15px",
                borderBottom: "1px solid #eee",
                paddingBottom: "15px",
              }}
            >
              <button
                style={{
                  background: "none",
                  border: "1px solid #ddd",
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                🔄 Start Over
              </button>
              <div style={{ fontWeight: "bold" }}>
                🏠 {properties.length} Properties
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                style={{
                  background: "none",
                  border: "1px solid #ddd",
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                🗺️ {showMap ? "Hide Map" : "Show Map"}
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
