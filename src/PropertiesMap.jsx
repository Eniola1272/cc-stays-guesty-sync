import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Webpack missing default Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const PropertiesMap = () => {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarkers = async () => {
            try {
                const response = await fetch('/wp-json/cc-stays/v1/map-markers');
                const data = await response.json();
                setMarkers(data);
            } catch (error) {
                console.error("Failed to load map data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMarkers();
    }, []);

    if (loading) return <div style={{ height: '500px', background: '#f5f5f5' }}>Loading Map...</div>;
    
    // Default center point (e.g., South Florida)
    const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [26.1224, -80.1373];

    return (
        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={center} zoom={10} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                {/* The free OpenStreetMap tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {markers.map(marker => (
                    <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                        <Popup>
                            <h4 style={{ margin: '0 0 5px 0', fontFamily: 'var(--cc-font-serif)' }}>
                                {marker.title}
                            </h4>
                            {marker.price && <p style={{ margin: '0 0 10px 0' }}><strong>${marker.price}</strong> / night</p>}
                            <a href={marker.url} className="cc-btn-primary" style={{ display: 'block', textAlign: 'center', padding: '8px' }}>
                                View Property
                            </a>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default PropertiesMap;
