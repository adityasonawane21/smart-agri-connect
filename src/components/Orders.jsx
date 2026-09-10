import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API } from "../config";
import RatingModal from "./RatingModal";
import RatingSummary from "./RatingSummary";
import OrderRouteMap from "./OrderRouteMap";

const steps = ["ACCEPTED", "PACKED", "READY_TO_DISPATCH", "IN_TRANSIT", "ARRIVED", "DELIVERED"];
const label = (s) => String(s || "").replaceAll("_", " ");

function Orders() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null); // {order}
  const [orderRatings, setOrderRatings] = useState({}); // orderId -> { my_rating }
  const [gpsActiveOrder, setGpsActiveOrder] = useState(null);
  const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const watchRef = useRef(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/api/orders?role=${role}&userId=${user.id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setOrders(d);

      // Pre-fetch ratings for delivered orders
      d.forEach((ord) => {
        if (ord.status === "DELIVERED") {
          checkRating(ord.id);
        }
      });
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Socket.IO real-time tracking listener
  useEffect(() => {
    const s = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = s;

    s.on("connect", () => setSocketConnected(true));
    s.on("disconnect", () => setSocketConnected(false));

    s.on("tracking:update", (data) => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (Number(ord.id) === Number(data.order_id)) {
            return {
              ...ord,
              live_lat: data.latitude || ord.live_lat,
              live_lng: data.longitude || ord.live_lng,
              tracking_status: data.status || ord.tracking_status,
              tracking_message: data.message,
              tracking_updated_at: data.timestamp,
            };
          }
          return ord;
        })
      );

      setSelected((cur) => {
        if (cur && Number(cur.id) === Number(data.order_id)) {
          return {
            ...cur,
            live_lat: data.latitude || cur.live_lat,
            live_lng: data.longitude || cur.live_lng,
            tracking_status: data.status || cur.tracking_status,
            tracking_message: data.message,
            tracking_updated_at: data.timestamp,
          };
        }
        return cur;
      });
    });

    s.on("order:update", (data) => {
      if (data && data.order_id) {
        load();
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const open = async (o) => {
    try {
      const r = await fetch(`${API}/api/orders/${o.id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSelected(d.order);
      setHistory(d.history || []);

      if (d.order.status === "DELIVERED") {
        checkRating(d.order.id);
      }
    } catch (e) {
      setMessage(e.message);
    }
  };

  const checkRating = async (orderId) => {
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/ratings?reviewer_id=${user.id}`);
      const d = await r.json();
      if (r.ok) {
        setOrderRatings((prev) => ({ ...prev, [orderId]: d }));
      }
    } catch (_) {}
  };

  const move = async (status) => {
    try {
      const r = await fetch(`${API}/api/orders/${selected.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, actor_id: user.id, actor_role: user.role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setMessage(d.message);
      await open(selected);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  // Farmer GPS & Tracking Action Handlers
  const handleFarmerUpdateLocation = async (orderId) => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }
    setMessage("Acquiring GPS location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`${API}/api/orders/${orderId}/tracking/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              farmer_id: user.id,
              latitude,
              longitude,
              message: "Farmer updated live GPS location",
            }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.message);
          setMessage("📍 Live GPS location broadcast to buyer successfully!");
          load();
          if (selected?.id === orderId) open(selected);
        } catch (err) {
          setMessage(`GPS error: ${err.message}`);
        }
      },
      async (err) => {
        // Fallback: simulate location increment along the route
        try {
          const ord = orders.find((x) => x.id === orderId) || selected;
          const baseLat = ord?.live_lat || ord?.origin_lat || 19.9975;
          const baseLng = ord?.live_lng || ord?.origin_lng || 73.7898;
          const newLat = baseLat + (Math.random() - 0.5) * 0.005;
          const newLng = baseLng + (Math.random() - 0.5) * 0.005;

          const res = await fetch(`${API}/api/orders/${orderId}/tracking/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              farmer_id: user.id,
              latitude: newLat,
              longitude: newLng,
              message: "Live location update (approximate)",
            }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.message);
          setMessage("📍 Location updated along route!");
          load();
          if (selected?.id === orderId) open(selected);
        } catch (e) {
          setMessage(e.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleInlineMap = (e, orderId) => {
    e.stopPropagation();
    setExpandedMapOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (!user) return (
    <div className="demand-page">
      <div className="demand-card">
        <h1>My Orders & Tracking</h1>
        <p>Please login to view orders.</p>
      </div>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="demand-header">
          <div>
            <p className="section-label">ORDER MANAGEMENT & ROUTE TRACKING</p>
            <h1>{role === "BUYER" ? "My Orders & Delivery Paths" : "My Sales & Delivery Paths"}</h1>
            <p>
              {role === "BUYER"
                ? "View accepted purchases, route polylines from each farmer pickup to your destination city, and review transactions."
                : "Manage accepted orders, road polyline routes from your pickup location to the buyer's destination city, and submit ratings."}
            </p>
          </div>
        </div>

        {message && (
          <div className="demand-message-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{message}</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMessage("")}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="empty-marketplace"><p>Loading orders & live tracking...</p></div>
        ) : orders.length === 0 ? (
          <div className="empty-marketplace">
            <h2>No orders yet</h2>
            <p>{role === "BUYER" ? "Accepted farmer requests will appear here with live road polylines." : "Accepted buyer requests will appear here with live tracking tools."}</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((o) => {
              const isDelivered = o.status === "DELIVERED";
              const isMapExpanded = expandedMapOrderId === o.id;
              const myRating = orderRatings[o.id]?.my_rating;

              return (
                <div className={`order-card${isDelivered ? " order-card--delivered" : ""}`} key={o.id} onClick={() => open(o)}>
                  <div className="order-card-top">
                    <span className="product-status">{label(o.status)}</span>
                    <span style={{ fontWeight: 600 }}>{o.order_code}</span>
                  </div>

                  <h2>{o.crop_name}</h2>
                  <div className="order-main-number">
                    {Number(o.quantity).toFixed(2)} {o.unit}
                    <span>₹{Number(o.order_value).toFixed(2)}</span>
                  </div>

                  <div className="order-meta">
                    <p>
                      <span>{role === "BUYER" ? "Farmer" : "Buyer"}</span>
                      <strong>{role === "BUYER" ? o.farmer_name : o.buyer_name}</strong>
                    </p>
                    <div className="order-rating-preview">
                      <RatingSummary userId={role === "BUYER" ? o.farmer_id : o.buyer_id} inline />
                    </div>
                    <p><span>From (Accepted Pickup)</span><strong>{o.pickup_location}</strong></p>
                    <p><span>To (Delivery City)</span><strong>{o.delivery_city}</strong></p>
                    <p><span>Shipment</span><strong>{o.shipment_code || "Direct delivery"}</strong></p>
                  </div>

                  {/* Rating Badge on Card */}
                  {isDelivered && (
                    <div className="order-card-rating-strip" onClick={(e) => e.stopPropagation()}>
                      {myRating ? (
                        <div className="rated-chip">
                          <span>You rated:</span>
                          <strong>{"★".repeat(myRating.rating)} {myRating.rating}/5</strong>
                        </div>
                      ) : (
                        <button
                          className="rate-cta-button"
                          onClick={() => setRatingModal(o)}
                        >
                          ⭐ Rate {role === "BUYER" ? "Farmer" : "Buyer"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline Map Preview */}
                  {isMapExpanded && (
                    <div className="inline-map-wrapper" onClick={(e) => e.stopPropagation()}>
                      <OrderRouteMap orderId={o.id} orderStatus={o.status} height={220} />
                    </div>
                  )}

                  {/* Card Action Row */}
                  <div className="order-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="map-toggle-button"
                      onClick={(e) => toggleInlineMap(e, o.id)}
                    >
                      {isMapExpanded ? "🗺️ Hide Path" : "🗺️ View Route Path"}
                    </button>

                    <button className="interest-button" onClick={() => open(o)}>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="order-detail-panel">
            <div className="order-detail-header">
              <div>
                <p className="section-label">{selected.order_code}</p>
                <h2>{selected.crop_name} • {Number(selected.quantity).toFixed(2)} {selected.unit}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="order-contact-grid">
              <div>
                <span>Farmer</span>
                <strong>{selected.farmer_name}</strong>
                <RatingSummary userId={selected.farmer_id} inline />
                <a href={`tel:${selected.farmer_account_phone || selected.farmer_phone}`}>
                  Call Farmer: {selected.farmer_account_phone || selected.farmer_phone || "Not available"}
                </a>
              </div>
              <div>
                <span>Buyer</span>
                <strong>{selected.buyer_name}</strong>
                <RatingSummary userId={selected.buyer_id} inline />
                <a href={`tel:${selected.buyer_phone || selected.buyer_account_phone}`}>
                  Call Buyer: {selected.buyer_phone || selected.buyer_account_phone || "Not available"}
                </a>
              </div>
              <div>
                <span>Delivery City Hub</span>
                <strong>{selected.delivery_city}</strong>
                <small>Exact street address kept private for delivery safety</small>
              </div>
              <div>
                <span>Required Date</span>
                <strong>{selected.required_date || "—"}</strong>
              </div>
            </div>

            {/* Road Polyline Live Map */}
            <div className="order-detail-map-section">
              <div className="section-title-row">
                <h3>🛣️ Live Order Route Polyline</h3>
                <span className="route-legend-pill">
                  🚜 From: {selected.pickup_location} ➔ 🏁 To: {selected.delivery_city}
                </span>
              </div>
              <OrderRouteMap orderId={selected.id} orderStatus={selected.status} height={340} />
            </div>

            <div className="status-timeline">
              {steps.map((s, i) => {
                const cur = steps.indexOf(selected.status);
                return (
                  <div className={`timeline-step ${i <= cur ? "done" : ""} ${selected.status === s ? "current" : ""}`} key={s}>
                    <span>{i < cur ? "✓" : i === cur ? "●" : "○"}</span>
                    <strong>{label(s)}</strong>
                  </div>
                );
              })}
            </div>

            {/* Farmer Status Controls */}
            {role === "FARMER" && (
              <div className="status-actions">
                <button disabled={selected.status !== "ACCEPTED"} onClick={() => move("PACKED")}>Mark Packed</button>
                <button disabled={selected.status !== "PACKED"} onClick={() => move("READY_TO_DISPATCH")}>Ready to Dispatch</button>
                <button disabled={selected.status !== "READY_TO_DISPATCH"} onClick={() => move("IN_TRANSIT")}>Start Transit</button>
                <button disabled={selected.status !== "IN_TRANSIT"} onClick={() => move("ARRIVED")}>Mark Arrived</button>
              </div>
            )}

            {/* Buyer Delivery Confirmation */}
            {role === "BUYER" && (
              <div className="status-actions">
                <button disabled={selected.status !== "ARRIVED"} onClick={() => move("DELIVERED")}>Confirm Delivery</button>
              </div>
            )}

            {/* Rating Section — for DELIVERED orders (Farmer & Buyer) */}
            {selected.status === "DELIVERED" && (
              <div className="order-rating-section">
                <h3>⭐ Ratings & Feedback</h3>
                {(() => {
                  const ratingData = orderRatings[selected.id];
                  const myRating = ratingData?.my_rating;

                  if (myRating) {
                    return (
                      <div className="existing-rating-box">
                        <p>You rated {role === "BUYER" ? "the farmer" : "the buyer"}:</p>
                        <div className="existing-rating-stars">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={i <= myRating.rating ? "star filled" : "star"}>★</span>
                          ))}
                          <strong>{myRating.rating}/5</strong>
                        </div>
                        {myRating.review && <p className="existing-review">"{myRating.review}"</p>}
                      </div>
                    );
                  }

                  return (
                    <div className="rating-prompt">
                      <p>
                        {role === "BUYER"
                          ? `How was your transaction experience with farmer ${selected.farmer_name}?`
                          : `How was your transaction experience with buyer ${selected.buyer_name}?`}
                      </p>
                      <button
                        className="interest-button"
                        onClick={() => setRatingModal(selected)}
                      >
                        ⭐ {role === "BUYER" ? "Rate Farmer" : "Rate Buyer"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="history-list">
              <h3>Status History</h3>
              {history.map((h) => (
                <div key={h.id}>
                  <strong>{label(h.status)}</strong>
                  <span>{h.note}</span>
                  <time>{new Date(h.created_at).toLocaleString()}</time>
                </div>
              ))}
            </div>

            {selected.shipment_code && (
              <p className="small-hint">
                This order belongs to shared shipment <strong>{selected.shipment_code}</strong>. You can open Smart Logistics to see combined multi-farmer stops.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          order={ratingModal}
          currentUser={user}
          onClose={() => setRatingModal(null)}
          onSuccess={() => {
            setMessage("Rating submitted successfully!");
            checkRating(ratingModal.id);
            if (selected) checkRating(selected.id);
          }}
        />
      )}
    </div>
  );
}

export default Orders;

