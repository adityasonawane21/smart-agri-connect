import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API } from "../config";

function InteractiveRouteMap({ shipmentId, routeStops = [] }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shipmentId) return;
    setLoading(true);
    setError("");

    fetch(`${API}/api/shipments/${shipmentId}/route-geometry`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRouteData(data);
        } else {
          setError(data.message || "Unable to load road geometry");
        }
      })
      .catch((err) => {
        setError("Failed to fetch route geometry.");
      })
      .finally(() => setLoading(false));
  }, [shipmentId]);

  useEffect(() => {
    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [routeData]);

  function initMap() {
    if (!mapRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const stops = routeData?.stops || [];
    const defaultCenter = stops.length > 0 ? [stops[0].lat, stops[0].lng] : [19.076, 72.8777];

    const map = L.map(mapRef.current).setView(defaultCenter, 9);
    leafletMapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const latLngs = [];

    // Render OSRM Road Polyline
    if (routeData?.geometry?.coordinates && routeData.geometry.coordinates.length > 0) {
      const polylinePoints = routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      L.polyline(polylinePoints, {
        color: "#16a34a",
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map);

      polylinePoints.forEach((p) => latLngs.push(p));
    }

    // Render Stop Markers
    stops.forEach((stop, index) => {
      latLngs.push([stop.lat, stop.lng]);
      const isDelivery = stop.type === "DELIVERY";

      const iconHtml = isDelivery
        ? `<div style="background:#b42318; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.35);">🏁</div>`
        : `<div style="background:#15803d; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.35);">${index + 1}</div>`;

      const customIcon = L.divIcon({
        className: "",
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const popupContent = `
        <div style="font-family:inherit; min-width:180px;">
          <span style="font-size:11px; font-weight:700; color:${isDelivery ? '#b42318' : '#15803d'}; text-transform:uppercase;">
            ${isDelivery ? '🏁 Delivery Destination' : `📦 Pickup Stop #${index + 1}`}
          </span>
          <h4 style="margin:4px 0 2px; font-size:14px; color:#1e293b;">${stop.location}</h4>
          <p style="margin:2px 0; font-size:12px; color:#64748b;">
            ${isDelivery ? `Buyer: <strong>${stop.buyer_name || 'Buyer'}</strong>` : `Farmer: <strong>${stop.farmer_name || 'Farmer'}</strong>`}
          </p>
          <p style="margin:2px 0; font-size:12px; color:#475569;">
            Quantity: <strong>${Number(stop.quantity).toFixed(0)} KG</strong>
          </p>
          <small style="color:#94a3b8; display:block; margin-top:4px;">${stop.address || ''}</small>
        </div>
      `;

      L.marker([stop.lat, stop.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }

  return (
    <div className="interactive-route-wrapper">
      <div className="route-map-meta-bar">
        <div className="meta-pills">
          <span className="meta-pill provider-pill">
            Routing: <strong>{routeData?.provider === "OSRM" ? "🛣️ Real Road Polyline (OSRM)" : "📐 Estimated Route"}</strong>
          </span>
          {routeData?.road_distance_km ? (
            <span className="meta-pill distance-pill">
              Road Distance: <strong>{routeData.road_distance_km} KM</strong>
            </span>
          ) : null}
          {routeData?.eta_minutes ? (
            <span className="meta-pill eta-pill">
              Estimated Duration: <strong>{Math.floor(routeData.eta_minutes / 60)}h {routeData.eta_minutes % 60}m</strong>
            </span>
          ) : null}
        </div>
        {loading && <span className="route-loading-indicator">Calculating road route...</span>}
      </div>

      {error && <div className="route-warn-banner">{error}</div>}

      <div
        ref={mapRef}
        style={{
          height: "440px",
          width: "100%",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid var(--line)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      />
      <div className="route-legend-bar">
        <span><strong style={{ color: "#15803d" }}>● 1, 2, 3...</strong> Farmer Pickup Stops</span>
        <span><strong style={{ color: "#b42318" }}>🏁</strong> Buyer Delivery Destination</span>
        <span><strong style={{ color: "#16a34a" }}>━</strong> Actual Road Polyline</span>
      </div>
    </div>
  );
}

function SmartLogistics() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/shipments?role=${user?.role || ""}&userId=${user?.id || ""}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setShipments(d);
      if (d.length && !selected) fetchDetail(d[0].id);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    try {
      const r = await fetch(`${API}/api/shipments/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSelected(d);
    } catch (e) {
      setMessage(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mins = selected?.summary?.estimated_minutes || 0;
  const hours = Math.floor(mins / 60),
    rem = mins % 60;
  const routeText = selected?.route?.map((r) => r.location).join(" → ") || "—";

  return (
    <div className="logistics-page">
      <div className="logistics-container">
        <div className="demand-header">
          <p className="section-label">SMART LOGISTICS</p>
          <h1>Shared Shipments & Optimized Multi-Farmer Route</h1>
          <p>
            Accepted orders are consolidated into optimized shared transport.
            Farmers share pickup routes and vehicle capacity to reduce freight costs.
          </p>
        </div>

        {message && <div className="demand-message-box">{message}</div>}

        {loading ? (
          <div className="empty-marketplace">
            <p>Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="empty-marketplace">
            <h2>No shipments yet</h2>
            <p>Accept buyer/farmer orders first. Compatible orders will share vehicle and route.</p>
          </div>
        ) : (
          <>
            <div className="shipment-selector">
              {shipments.map((s) => (
                <button
                  key={s.id}
                  className={selected?.shipment?.id === s.id ? "selected" : ""}
                  onClick={() => fetchDetail(s.id)}
                >
                  <span>{s.shipment_code}</span>
                  <strong>
                    {s.crop_name} • {Number(s.total_quantity).toFixed(0)} KG
                  </strong>
                  <small>
                    {s.order_count} orders • {s.destination_city}
                  </small>
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div className="shipment-hero">
                  <div>
                    <p className="section-label">{selected.shipment.shipment_code}</p>
                    <h2>{selected.shipment.crop_name} • Consolidated Shipment</h2>
                    <p>
                      {selected.shipment.order_count || selected.orders.length} orders •{" "}
                      {selected.farmers.length} farmers • {selected.buyers.length} buyers
                    </p>
                  </div>
                  <span className="shipment-status-badge">
                    {selected.shipment.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="logistics-stats">
                  <div>
                    <span>Total Load</span>
                    <strong>{selected.summary.total_quantity} KG</strong>
                    <small>of {selected.summary.vehicle_capacity} KG capacity</small>
                  </div>
                  <div>
                    <span>Route Distance</span>
                    <strong>{selected.summary.total_distance_km} KM</strong>
                    <small>actual road route</small>
                  </div>
                  <div>
                    <span>Travel Time</span>
                    <strong>
                      {hours}h {rem}m
                    </strong>
                    <small>estimated</small>
                  </div>
                  <div>
                    <span>ETA</span>
                    <strong>
                      {selected.summary.estimated_arrival
                        ? new Date(selected.summary.estimated_arrival).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </strong>
                    <small>
                      {selected.summary.estimated_arrival
                        ? new Date(selected.summary.estimated_arrival).toLocaleDateString()
                        : "—"}
                    </small>
                  </div>
                </div>

                {/* Real Road Route Map */}
                <div className="route-section">
                  <div className="section-heading-row">
                    <div>
                      <p className="section-label">ROAD ROUTE & STOPS</p>
                      <h2>Optimized Road Polyline & Pickup Stops</h2>
                      <p>{routeText}</p>
                    </div>
                  </div>
                  <InteractiveRouteMap shipmentId={selected.shipment.id} routeStops={selected.route} />
                </div>

                <div className="logistics-two-col">
                  <div className="logistics-panel">
                    <h3>Route Stops</h3>
                    {selected.route.map((r, i) => (
                      <div className="route-stop" key={i}>
                        <div className={`route-dot ${r.type.toLowerCase()}`}>{r.stop}</div>
                        <div>
                          <strong>{r.location}</strong>
                          <span>
                            {r.type === "PICKUP"
                              ? `${r.farmer_name} • ${r.quantity} KG`
                              : `${r.buyer_name} • ${r.quantity} KG`}
                          </span>
                          {r.address && <small>{r.address}</small>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="logistics-panel">
                    <h3>Vehicle & Cost</h3>
                    <div className="vehicle-box">
                      <p>
                        <span>Vehicle</span>
                        <strong>{selected.shipment.vehicle_number}</strong>
                      </p>
                      <p>
                        <span>Type</span>
                        <strong>{selected.shipment.vehicle_type}</strong>
                      </p>
                      <p>
                        <span>Driver</span>
                        <strong>{selected.shipment.driver_name}</strong>
                      </p>
                      <p>
                        <span>Driver Contact</span>
                        <strong>{selected.shipment.driver_phone}</strong>
                      </p>
                    </div>

                    <div className="cost-breakdown">
                      <p>
                        <span>Fuel estimate</span>
                        <strong>₹{selected.summary.fuel_cost}</strong>
                      </p>
                      <p>
                        <span>Toll estimate</span>
                        <strong>₹{selected.summary.toll_estimate}</strong>
                      </p>
                      <p>
                        <span>Driver estimate</span>
                        <strong>₹{selected.summary.driver_cost}</strong>
                      </p>
                      <p>
                        <span>Loading</span>
                        <strong>₹{selected.summary.loading_cost}</strong>
                      </p>
                      <p className="total">
                        <span>Total transport</span>
                        <strong>₹{selected.summary.total_transport_cost}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="logistics-panel">
                  <h3>Fair Cost Allocation</h3>
                  <div className="cost-table">
                    <div className="cost-row header">
                      <span>Farmer</span>
                      <span>Quantity</span>
                      <span>Share</span>
                      <span>Transport Share</span>
                    </div>
                    {selected.farmerCosts.map((f) => (
                      <div className="cost-row" key={f.farmer_id}>
                        <span>
                          {f.farmer_name}
                          <small>{f.pickup_location}</small>
                        </span>
                        <span>{f.quantity} KG</span>
                        <span>{f.percentage}%</span>
                        <strong>₹{f.transport_share}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shipment-orders">
                  <h3>Orders in This Shared Shipment</h3>
                  <div className="orders-mini-grid">
                    {selected.orders.map((o) => (
                      <div key={o.id}>
                        <span className="product-status">{o.status.replaceAll("_", " ")}</span>
                        <strong>{o.order_code}</strong>
                        <p>
                          {o.buyer_name} • {o.quantity} KG → {o.delivery_city}
                        </p>
                        <small>
                          Farmer: {o.farmer_name} • Pickup: {o.pickup_location}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SmartLogistics;
