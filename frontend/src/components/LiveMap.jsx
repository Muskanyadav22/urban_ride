import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon (Vite issue with image paths)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DriverIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk3IDAgMCA1LjU5NyAwIDEyLjVjMCAyMC4zMiAxMi41IDI4LjUgMTIuNSAyOC41czEyLjUtOC4xOCAxMi41LTI4LjVDMjUgNS41OTcgMTkuNDAzIDAgMTIuNSAweiIgZmlsbD0iIzQyODVGNCIvPjwvc3ZnPg==",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DestinationIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk3IDAgMCA1LjU5NyAwIDEyLjVjMCAyMC4zMiAxMi41IDI4LjUgMTIuNSAyOC41czEyLjUtOC4xOCAxMi41LTI4LjVDMjUgNS41OTcgMTkuNDAzIDAgMTIuNSAweiIgZmlsbD0iI0YzQkEzQiIvPjwvc3ZnPg==",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LiveMap({ liveDrivers = {}, userLocation = null, destination = null }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const mapInstanceRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const defaultLat = userLocation?.lat || 28.7041;
      const defaultLng = userLocation?.lng || 77.1025;

      mapInstanceRef.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      // Add user marker if location available
      if (userLocation) {
        L.marker([userLocation.lat, userLocation.lng], { icon: DefaultIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("📍 Your Location");
      }

      // Add destination marker if available
      if (destination) {
        L.marker([destination.lat, destination.lng], { icon: DestinationIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("🎯 Destination");
      }
    }
  }, []);

  // Update driver markers in real-time
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.entries(liveDrivers).forEach(([driverId, location]) => {
      if (markersRef.current[driverId]) {
        // Update existing marker position
        markersRef.current[driverId].setLatLng([location.lat, location.lng]);
      } else {
        // Create new marker for driver
        const marker = L.marker([location.lat, location.lng], { icon: DriverIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`🚕 Driver ${driverId}`);
        markersRef.current[driverId] = marker;
      }
    });

    // Remove markers for drivers no longer in live list
    Object.keys(markersRef.current).forEach((driverId) => {
      if (!liveDrivers[driverId]) {
        mapInstanceRef.current.removeLayer(markersRef.current[driverId]);
        delete markersRef.current[driverId];
      }
    });
  }, [liveDrivers]);

  return (
    <div style={{
      width: "100%",
      height: "400px",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      marginBottom: "20px",
      border: "2px solid #667eea"
    }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
