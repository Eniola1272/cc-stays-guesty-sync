import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "react-datepicker/dist/react-datepicker.css";
import "leaflet/dist/leaflet.css";
import "./StaysPage.css";
import L from "leaflet";

// Price pill icon for the map
const createPriceIcon = (price) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background: #3b5240;
      color: #fff;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid #fff;
      cursor: pointer;
      transform: translate(-50%, -50%);
      display: inline-block;
    ">$${price}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  });

// --- CC STAYS ICON TOOLKIT ---

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
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

const PersonIcon = () => (
  <svg
    width="20"
    height="20"
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

const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const HouseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const GuestIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.00021 22C7.99992 19.6795 8.57644 17.3953 9.67792 15.3529C10.7794 13.3105 12.3713 11.5739 14.3104 10.2993C16.2495 9.02468 18.4751 8.25209 20.7868 8.05097C23.0986 7.84986 25.4241 8.22653 27.5542 9.14712C29.6843 10.0677 31.5522 11.5033 32.9898 13.3249C34.4274 15.1464 35.3897 17.2967 35.7902 19.5824C36.1906 21.8681 36.0166 24.2175 35.2838 26.4193C34.5511 28.621 33.2825 30.6061 31.5922 32.196C34.779 33.7432 37.5459 36.0358 39.6585 38.8795C41.7711 41.7232 43.1671 45.0342 43.7282 48.532C43.7899 48.9212 43.7744 49.3188 43.6824 49.7021C43.5905 50.0853 43.424 50.4467 43.1924 50.7655C42.9608 51.0844 42.6687 51.3545 42.3327 51.5605C41.9967 51.7665 41.6234 51.9043 41.2342 51.966C40.845 52.0277 40.4474 52.0122 40.0641 51.9202C39.6809 51.8283 39.3195 51.6618 39.0007 51.4302C38.6818 51.1986 38.4117 50.9065 38.2057 50.5705C37.9997 50.2345 37.8619 49.8612 37.8002 49.472C37.2002 45.7132 35.2799 42.2915 32.3841 39.8212C29.4882 37.3509 25.8065 35.9939 22.0002 35.9939C18.1939 35.9939 14.5122 37.3509 11.6163 39.8212C8.72048 42.2915 6.80016 45.7132 6.20021 49.472C6.13822 49.8612 6.00018 50.2345 5.79396 50.5704C5.58774 50.9062 5.31738 51.1982 4.99832 51.4296C4.67926 51.661 4.31774 51.8273 3.93441 51.919C3.55108 52.0107 3.15345 52.026 2.76421 51.964C2.37497 51.902 2.00175 51.764 1.66586 51.5578C1.32998 51.3515 1.03799 51.0812 0.80659 50.7621C0.575187 50.4431 0.408893 50.0815 0.317204 49.6982C0.225515 49.3149 0.210226 48.9172 0.27221 48.528C0.831299 45.0305 2.22659 41.7196 4.33947 38.8769C6.45235 36.0342 9.22036 33.7437 12.4082 32.2C11.0162 30.8907 9.90701 29.3103 9.14892 27.5561C8.39082 25.8019 7.9999 23.911 8.00021 22ZM44.0002 16C46.3242 16.0016 48.5978 16.6779 50.545 17.9466C52.4922 19.2154 54.0292 21.0221 54.9695 23.1474C55.9097 25.2728 56.2128 27.6254 55.842 29.9196C55.4711 32.2139 54.4422 34.3512 52.8802 36.072C55.3163 37.2788 57.4807 38.9696 59.2414 41.0411C61.002 43.1126 62.3218 45.5213 63.1202 48.12C63.2787 48.6243 63.301 49.1615 63.1848 49.6772C63.0686 50.1929 62.8181 50.6687 62.4586 51.0562C62.099 51.4438 61.6434 51.7293 61.1379 51.8838C60.6323 52.0383 60.0949 52.0563 59.5802 51.936C59.0655 51.817 58.5915 51.5642 58.2059 51.2032C57.8203 50.8421 57.5368 50.3857 57.3842 49.88C56.6662 47.5614 55.3595 45.4686 53.5914 43.8057C51.8234 42.1427 49.6544 40.9666 47.2962 40.392C46.6411 40.2339 46.0584 39.8598 45.6419 39.3301C45.2254 38.8004 44.9993 38.1459 45.0002 37.472V36.064C44.9998 35.5055 45.1554 34.9579 45.4494 34.483C45.7434 34.0081 46.1641 33.6247 46.6642 33.376C47.8768 32.775 48.8507 31.7817 49.4275 30.5574C50.0044 29.3331 50.1504 27.9497 49.8418 26.632C49.5332 25.3142 48.7882 24.1395 47.7277 23.2986C46.6672 22.4577 45.3536 22.0001 44.0002 22C43.2045 22 42.4415 21.6839 41.8789 21.1213C41.3163 20.5587 41.0002 19.7957 41.0002 19C41.0002 18.2044 41.3163 17.4413 41.8789 16.8787C42.4415 16.3161 43.2045 16 44.0002 16ZM22.0002 14C20.9348 13.9759 19.8754 14.1649 18.8841 14.5559C17.8928 14.9469 16.9896 15.532 16.2275 16.2768C15.4654 17.0217 14.8598 17.9113 14.4463 18.8934C14.0328 19.8755 13.8196 20.9303 13.8193 21.996C13.8191 23.0616 14.0317 24.1165 14.4448 25.0989C14.8578 26.0812 15.4629 26.9711 16.2246 27.7163C16.9864 28.4615 17.8893 29.0471 18.8804 29.4386C19.8715 29.83 20.9308 30.0196 21.9962 29.996C24.0864 29.9498 26.0755 29.0871 27.5377 27.5927C28.9998 26.0982 29.8188 24.0907 29.8193 22C29.8199 19.9092 29.0019 17.9013 27.5405 16.4061C26.0791 14.911 24.0904 14.0473 22.0002 14Z"
      fill="#36543B"
      fillOpacity="0.54"
    />
  </svg>
);

const BedroomIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M56.0002 28.7467V21.3334C56.0002 16.9334 52.4002 13.3334 48.0002 13.3334H37.3335C35.2802 13.3334 33.4135 14.1334 32.0002 15.4134C30.5868 14.1334 28.7202 13.3334 26.6668 13.3334H16.0002C11.6002 13.3334 8.00016 16.9334 8.00016 21.3334V28.7467C6.3735 30.2134 5.3335 32.32 5.3335 34.6667V48C5.3335 49.4667 6.5335 50.6667 8.00016 50.6667C9.46683 50.6667 10.6668 49.4667 10.6668 48V45.3334H53.3335V48C53.3335 49.4667 54.5335 50.6667 56.0002 50.6667C57.4668 50.6667 58.6668 49.4667 58.6668 48V34.6667C58.6668 32.32 57.6268 30.2134 56.0002 28.7467ZM37.3335 18.6667H48.0002C49.4668 18.6667 50.6668 19.8667 50.6668 21.3334V26.6667H34.6668V21.3334C34.6668 19.8667 35.8668 18.6667 37.3335 18.6667ZM13.3335 21.3334C13.3335 19.8667 14.5335 18.6667 16.0002 18.6667H26.6668C28.1335 18.6667 29.3335 19.8667 29.3335 21.3334V26.6667H13.3335V21.3334ZM10.6668 40V34.6667C10.6668 33.2 11.8668 32 13.3335 32H50.6668C52.1335 32 53.3335 33.2 53.3335 34.6667V40H10.6668Z"
      fill="#36543B"
      fillOpacity="0.54"
    />
  </svg>
);

const BathroomIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M56.0002 37.3334V40C56.0002 45.0934 53.1468 49.52 48.9335 51.76L50.6668 58.6667H45.3335L44.0002 53.3334H20.0002L18.6668 58.6667H13.3335L15.0668 51.76C12.9319 50.6265 11.146 48.9329 9.90102 46.861C8.65601 44.7891 7.99887 42.4172 8.00016 40V37.3334H5.3335V32H53.3335V13.3334C53.3335 12.6261 53.0525 11.9479 52.5525 11.4478C52.0524 10.9477 51.3741 10.6667 50.6668 10.6667C49.3335 10.6667 48.3202 11.5734 48.0002 12.7734C49.6802 14.2134 50.6668 16.3467 50.6668 18.6667H34.6668C34.6668 16.545 35.5097 14.5101 37.01 13.0099C38.5103 11.5096 40.5451 10.6667 42.6668 10.6667H43.1202C44.2135 7.57337 47.1735 5.33337 50.6668 5.33337C52.7886 5.33337 54.8234 6.17623 56.3237 7.67652C57.824 9.17681 58.6668 11.2116 58.6668 13.3334V37.3334H56.0002ZM50.6668 37.3334H13.3335V40C13.3335 42.1218 14.1764 44.1566 15.6766 45.6569C17.1769 47.1572 19.2118 48 21.3335 48H42.6668C44.7886 48 46.8234 47.1572 48.3237 45.6569C49.824 44.1566 50.6668 42.1218 50.6668 40V37.3334Z"
      fill="#36543B"
      fillOpacity="0.54"
    />
  </svg>
);

const StartOverIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="1 4 1 10 7 10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);

const StaysPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(window.innerWidth > 768);

  // Filter State
  const [locationFilter, setLocationFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState(0);
  const [pets, setPets] = useState(0);

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

    // Pre-populate filters from URL params (passed from home page search bar)
    const params = new URLSearchParams(window.location.search);
    if (params.get("location")) setLocationFilter(params.get("location"));
    if (params.get("guests")) setGuests(parseInt(params.get("guests"), 10));
    if (params.get("pets")) setPets(parseInt(params.get("pets"), 10));
    if (params.get("checkIn") && params.get("checkOut")) {
      setDateRange([
        new Date(params.get("checkIn")),
        new Date(params.get("checkOut")),
      ]);
    }
  }, []);

  // Derived filtered list — client-side filter on top of whatever the API returned
  const filteredProperties = properties.filter((prop) => {
    if (
      locationFilter &&
      !prop.city.toLowerCase().includes(locationFilter.toLowerCase())
    )
      return false;
    if (guests > 0 && prop.guests < guests) return false;
    if (pets > 0 && prop.pets !== undefined && prop.pets < pets) return false;
    return true;
  });

  const handleReset = () => {
    setLocationFilter("");
    setDateRange([null, null]);
    setGuests(0);
    setPets(0);
    window.history.replaceState({}, "", window.location.pathname);
    // Re-fetch all properties without filters
    fetch("/wp-json/cc-stays/v1/search-stays")
      .then((r) => r.json())
      .then(setProperties)
      .catch((err) => console.error("Error reloading stays:", err));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locationFilter) params.append("location", locationFilter);
    if (startDate)
      params.append("checkIn", startDate.toISOString().split("T")[0]);
    if (endDate) params.append("checkOut", endDate.toISOString().split("T")[0]);
    if (guests > 0) params.append("guests", guests);
    if (pets > 0) params.append("pets", pets);

    setLoading(true);
    fetch(`/wp-json/cc-stays/v1/search-stays?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error searching stays:", err);
        setLoading(false);
      });
  };

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Loading pristine stays...
      </div>
    );

  const mapCenter =
    filteredProperties.length > 0
      ? [filteredProperties[0].lat, filteredProperties[0].lng]
      : [26.1224, -80.1373];

  return (
    <div className="stays-page">
      {/* MAIN CONTENT: Split Grid & Map */}
      <div
        className="stays-layout"
        style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
      >
        {/* LEFT: Property Grid */}
        <div className="stays-left">
          {/* TOP BAR: Search & Filters */}
          <div style={{ marginBottom: "30px" }}>
            <form
              onSubmit={handleSearch}
              className="stays-search-form"
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                height: "48px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  background: "#EFECE5",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {/* WHERE */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 15px",
                    borderRight: "1px solid #d4d1ca",
                    minWidth: 0,
                    flex: "1.2",
                  }}
                >
                  <span
                    style={{
                      marginRight: "8px",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                      color: "#2a2725",
                    }}
                  >
                    <GlobeIcon />
                  </span>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Where"
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "14px",
                      color: "#2a2725",
                      width: "100%",
                      minWidth: 0,
                    }}
                  />
                </div>
                {/* WHEN */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 15px",
                    borderRight: "1px solid #d4d1ca",
                  }}
                >
                  <span
                    style={{
                      marginRight: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      color: "#2a2725",
                    }}
                  >
                    <CalendarIcon /> When
                  </span>
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={setDateRange}
                    placeholderText="Add dates"
                    className="cc-minimal-datepicker"
                    calendarClassName="cc-search-calendar"
                    monthsShown={2}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    gap: "20px",
                    borderLeft: "1px solid #d4d1ca",
                  }}
                >
                  {[
                    {
                      label: "Who",
                      icon: <PersonIcon />,
                      value: guests,
                      set: setGuests,
                    },
                    { label: "🐾 Pets", icon: null, value: pets, set: setPets },
                  ].map(({ label, icon, value, set }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      {icon}
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#2a2725",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => set(Math.max(0, value - 1))}
                        style={{
                          width: "26px",
                          height: "26px",
                          aspectRatio: "1 / 1",
                          flexShrink: 0,
                          borderRadius: "50%",
                          border: "1px solid #aaa",
                          background: "#fff",
                          color: "#333",
                          padding: 0,
                          cursor: value === 0 ? "default" : "pointer",
                          fontSize: "15px",
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: value === 0 ? 0.3 : 1,
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#2a2725",
                          minWidth: "24px",
                          textAlign: "center",
                        }}
                      >
                        {value}
                      </span>
                      <button
                        type="button"
                        onClick={() => set(value + 1)}
                        style={{
                          width: "26px",
                          height: "26px",
                          aspectRatio: "1 / 1",
                          flexShrink: 0,
                          borderRadius: "50%",
                          border: "1px solid #aaa",
                          background: "#fff",
                          color: "#333",
                          padding: 0,
                          cursor: "pointer",
                          fontSize: "15px",
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
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
                  fontSize: "13px",
                }}
              >
                SEARCH
              </button>
            </form>

            {/* SUB BAR: Toggles */}
            <div className="stays-subbar">
              <button
                onClick={handleReset}
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
                  letterSpacing: "0.5px",
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
                  letterSpacing: "0.5px",
                }}
              >
                <HouseIcon /> {filteredProperties.length} Properties
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
                  letterSpacing: "0.5px",
                }}
              >
                <GlobeIcon /> {showMap ? "HIDE MAP" : "SHOW MAP"}
              </button>
            </div>
          </div>
          <div
            className={
              showMap
                ? "stays-grid stays-grid--with-map"
                : "stays-grid stays-grid--full"
            }
            style={{
              flex: showMap ? "0 0 60%" : "1",
              display: "grid",
              gridTemplateColumns: showMap
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {filteredProperties.map((prop) => (
              <div className="stays-card" key={prop.id}>
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="stays-card-img"
                />
                <div className="stays-card-body">
                  <p className="stays-card-location">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {prop.city}
                  </p>
                  <h3 className="stays-card-title">{prop.title}</h3>
                  {/* {prop.description && (
                    <p className="stays-card-desc">{prop.description}</p>
                  )} */}
                  <div className="stays-card-stats">
                    <span>
                      <GuestIcon /> {prop.guests}
                    </span>
                    <span>
                      <BedroomIcon /> {prop.bedrooms}
                    </span>
                    <span>
                      <BathroomIcon /> {prop.bathrooms}
                    </span>
                  </div>
                  <a href={prop.url} className="stays-card-btn">
                    VIEW STAYS
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Sticky Map */}
        {showMap && (
          <div
            className="stays-map"
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
              {filteredProperties.map((prop) => (
                <Marker
                  key={prop.id}
                  position={[prop.lat, prop.lng]}
                  icon={createPriceIcon(prop.price)}
                >
                  <Popup minWidth={220}>
                    <div style={{ fontFamily: "var(--cc-font-primary)" }}>
                      <img
                        src={prop.image}
                        alt={prop.title}
                        style={{
                          width: "100%",
                          height: "130px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginBottom: "10px",
                        }}
                      />
                      <strong
                        style={{
                          fontSize: "15px",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        {prop.title}
                      </strong>
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        📍 {prop.city}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "12px",
                          color: "#444",
                          margin: "8px 0",
                        }}
                      >
                        <span>🛏️ {prop.bedrooms} bed</span>
                        <span>🛁 {prop.bathrooms} bath</span>
                        <span>👥 {prop.guests} guests</span>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          marginBottom: "10px",
                        }}
                      >
                        ${prop.price}{" "}
                        <span style={{ fontWeight: "normal", color: "#888" }}>
                          / night
                        </span>
                      </div>
                      <a
                        href={prop.url}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "#3b5240",
                          color: "#fff",
                          padding: "8px",
                          borderRadius: "4px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        View Stay →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY SEARCH BAR ── */}
      {/* Lives inside .stays-page so position:sticky + bottom:0 keeps it */}
      {/* pinned to the bottom of the section, NOT the viewport.          */}
      {/* Once the user scrolls past .stays-page, the bar scrolls away    */}
      {/* and the footer is fully visible.                                */}
      <div className="stays-mobile-search">
        <form onSubmit={handleSearch} className="stays-mobile-search-inner">
          <div className="stays-mobile-search-fields">
            <div className="stays-mobile-search-row">
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Where"
                className="stays-mobile-search-input"
              />
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={setDateRange}
                placeholderText="Dates"
                className="stays-mobile-search-input"
                calendarClassName="cc-search-calendar"
              />
            </div>
            <div className="stays-mobile-search-row">
              <div className="stays-mobile-guest-picker">
                <span>👥</span>
                <button
                  type="button"
                  className="stays-mobile-guest-btn"
                  onClick={() => setGuests(Math.max(0, guests - 1))}
                  style={{ opacity: guests === 0 ? 0.3 : 1 }}
                >
                  −
                </button>
                <span style={{ minWidth: "20px", textAlign: "center" }}>
                  {guests}
                </span>
                <button
                  type="button"
                  className="stays-mobile-guest-btn"
                  onClick={() => setGuests(guests + 1)}
                >
                  +
                </button>
              </div>
              <div className="stays-mobile-guest-picker">
                <span>🐾</span>
                <button
                  type="button"
                  className="stays-mobile-guest-btn"
                  onClick={() => setPets(Math.max(0, pets - 1))}
                  style={{ opacity: pets === 0 ? 0.3 : 1 }}
                >
                  −
                </button>
                <span style={{ minWidth: "20px", textAlign: "center" }}>
                  {pets}
                </span>
                <button
                  type="button"
                  className="stays-mobile-guest-btn"
                  onClick={() => setPets(pets + 1)}
                >
                  +
                </button>
              </div>
              <button type="submit" className="stays-mobile-search-btn">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaysPage;
