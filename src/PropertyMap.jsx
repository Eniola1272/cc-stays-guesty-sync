import React, { useMemo } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CC_MONO_SVG =
  '<svg viewBox="0 0 460.33 460.33" fill="currentColor" aria-hidden="true"><path d="M354.66,304.51c21.89-.15,42.7-7.56,56.13-21.08v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71Z"/><path d="M187.28,283.43v-6.35c-12.63,16.1-32.99,22.89-56.14,22.89-35.22,0-64.26-34.04-65.07-69.11-.8-34.41,22.78-69.86,65.07-70.54,30.07-.49,50.51,13.23,56.14,31.57v-19.04c-13.95-12.2-34.84-17.03-56.14-17.03-55.12,0-81.78,36.97-81.6,73.97.18,37.52,27.94,75.1,81.61,74.71,21.89-.15,42.7-7.56,56.13-21.08Z"/><path d="M230.17,460.33c127.12,0,230.17-103.05,230.17-230.17S357.28,0,230.17,0,0,103.05,0,230.17s103.05,230.17,230.17,230.17ZM6.88,236.09C3.78,110.09,104.2,22.46,225.81,20.58c120.4-1.86,223.48,79.19,227.72,202.49,2.9,84.3-43.16,159.37-120.93,194.77-69.16,31.49-149.87,29.26-216.19-5.65C49.74,377.08,8.73,311,6.88,236.09Z"/><rect x="227.11" y="138.6" width="6.1" height="183.13"/></svg>';

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const PropertyMap = ({ mountNode }) => {
  const lat = Number.parseFloat(mountNode?.dataset?.lat || "");
  const lng = Number.parseFloat(mountNode?.dataset?.lng || "");
  const title = mountNode?.dataset?.title || "CC Stays location";

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "cc-property-leaflet-div-icon",
        html: `<div class="cc-property-leaflet-marker" aria-label="${escapeAttribute(title)}"><span class="ring"></span><span class="core">${CC_MONO_SVG}</span></div>`,
        iconAnchor: [37, 37],
        iconSize: [74, 74],
      }),
    [title],
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <span>Map location coming soon.</span>;
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="cc-property-leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
};

export default PropertyMap;
