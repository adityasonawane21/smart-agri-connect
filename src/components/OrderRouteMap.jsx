import { useEffect, useRef, useState } from "react";
import { API } from "../config";

function OrderRouteMap({ orderId, orderStatus, height = 320 }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError("");

    fetch(`${API}/api/orders/${orderId}/route-geometry`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setRouteInfo(data);
        } else {
          setError(data.message || "Unable to fetch route geometry");
        }
      })
      .catch(() => {
        setError("Failed to connect to route service");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [routeInfo]);

  function initMap() {
    if (!mapRef.current || !window.L || !routeInfo) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const { origin, destination, geometry, live_tracking } = routeInfo;
    const center = [origin.lat, origin.lng];

    const map = window.L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(center, 9);
    leafletMapRef.current = map;

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = [];
    const boundsPoints = [];

    // 1. Origin Marker (Farmer Pickup - where order was accepted)
    const originIcon = window.L.divIcon({
      className: "",
      html: `
        <div style="background:#166534; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; border:2.5px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.35);">
          🚜
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const originMarker = window.L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:inherit; min-width:160px;">
          <span style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase;">📍 Order Accepted Origin</span>
          <h4 style="margin:3px 0; font-size:14px; color:#0f172a;">${origin.farmer_name || "Farmer"}</h4>
          <p style="margin:2px 0; font-size:12px; color:#475569;">Pickup: <strong>${origin.location || "Farm"}</strong></p>
        </div>
      `);
    markersRef.current.push(originMarker);
    boundsPoints.push([origin.lat, origin.lng]);

    // 2. Destination Marker (Order Destination City - General City only, privacy preserved)
    const destIcon = window.L.divIcon({
      className: "",
      html: `
        <div style="background:#b42318; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; border:2.5px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.35);">
          🏁
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const destMarker = window.L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:inherit; min-width:160px;">
          <span style="font-size:11px; font-weight:700; color:#b42318; text-transform:uppercase;">🏁 Order Placed Delivery City</span>
          <h4 style="margin:3px 0; font-size:14px; color:#0f172a;">${destination.city || "Destination"}</h4>
          <small style="color:#64748b; font-size:11px;">Approximate city hub (exact address hidden for safety)</small>
        </div>
      `);
    markersRef.current.push(destMarker);
    boundsPoints.push([destination.lat, destination.lng]);

    // 3. Render Road Polyline (Different per farmer!)
    if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
      const latLngs = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      // Distinct, high-contrast road polyline color per order
      const colors = ["#0284c7", "#16a34a", "#8b5cf6", "#d97706", "#059669", "#dc2626"];
      const lineColor = colors[Number(orderId) % colors.length] || "#0284c7";

      polylineRef.current = window.L.polyline(latLngs, {
        color: lineColor,
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(map);

      latLngs.forEach((pt) => boundsPoints.push(pt));
    }

    if (boundsPoints.length > 0) {
      map.fitBounds(window.L.latLngBounds(boundsPoints), { padding: [35, 35] });
    }
  }

  if (loading) {
    return (
      <div className="order-map-loading" style={{ height }}>
        <span className="location-spinner">⏳</span>
        <p>Loading farmer route polyline...</p>
      </div>
    );
  }

  if (error || !routeInfo) {
    return (
      <div className="order-map-error" style={{ height }}>
        <p>⚠️ {error || "Route unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="order-route-map-shell">
      <div className="order-route-map-topbar">
        <div className="order-route-pills">
          <span className="route-pill origin-pill">
            🚜 <strong>{routeInfo.origin.location}</strong> ({routeInfo.farmer_name})
          </span>
          <span className="route-arrow">➔</span>
          <span className="route-pill dest-pill">
            🏁 <strong>{routeInfo.destination.city}</strong> (City Hub)
          </span>
        </div>
        <div className="order-route-stats">
          {routeInfo.distance_km && (
            <span className="route-stat-badge">
              🛣️ <strong>{routeInfo.distance_km} KM</strong> road
            </span>
          )}
          {routeInfo.duration_minutes && (
            <span className="route-stat-badge">
              ⏱️ ~{routeInfo.duration_minutes} mins
            </span>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", zIndex: 1 }}
      />

      <div className="order-route-map-footer">
        <small>
          🛣️ <strong>Route Path:</strong> Showing starting point (accepted pickup) and ending point (delivery city hub) connected via road polyline.
        </small>
      </div>
    </div>
  );
}

export default OrderRouteMap;
