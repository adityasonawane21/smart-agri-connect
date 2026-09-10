import { useEffect, useState } from "react";
import { API } from "../config";
import LocationPicker from "./LocationPicker";

function BuyerDemand() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    crop_name: "",
    required_quantity: "",
    unit: "KG",
    destination: user?.location || "Mumbai",
    delivery_address: "",
    delivery_lat: null,
    delivery_lng: null,
    delivery_contact_name: user?.name || "",
    delivery_phone: user?.phone || "",
    required_date: "",
    max_price_per_unit: "",
    preferred_size: "ANY",
    preferred_quality: "ANY",
    preferred_condition: "ANY",
    allow_mixed: true,
  });

  const [demands, setDemands] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const load = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API}/api/demands`);
      const data = await response.json();

      if (response.ok) {
        setDemands(
          data.filter(
            (item) => Number(item.buyer_id) === Number(user.id)
          )
        );
      } else {
        setMessage(data.message || "Unable to load demands.");
      }
    } catch (error) {
      setMessage("Unable to load demands.");
    }
  };

  useEffect(() => {
    if (user?.role === "BUYER") {
      load();
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/demands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyer_id: user.id,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to post demand.");
      }

      setMessage(data.message || "Demand posted successfully.");
      setForm((previous) => ({
        ...previous,
        crop_name: "",
        required_quantity: "",
        max_price_per_unit: "",
      }));
      await load();
    } catch (error) {
      setMessage(error.message || "Unable to post demand.");
    } finally {
      setLoading(false);
    }
  };

  const find = async (demand) => {
    setSelected(demand);
    setSummary(null);
    setMatches([]);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/demands/${demand.id}/matches`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to find matches.");
      }

      setMatches(data.matches || []);
      setSummary(data.summary || null);
    } catch (error) {
      setMessage(error.message || "Unable to find matching farmers.");
    }
  };

  const sendOffer = async (product) => {
    if (!selected) return;

    try {
      const response = await fetch(`${API}/api/supply-offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demand_id: selected.id,
          farmer_id: product.farmer_id,
          product_id: product.id,
          offered_quantity: product.matched_quantity,
          offered_price_per_unit: product.price_per_unit,
          message: `Buyer demand match for ${product.matched_quantity} ${product.unit}.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send supply offer.");
      }

      setMessage(data.message || "Supply offer sent successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to send supply offer.");
    }
  };

  if (user?.role !== "BUYER") {
    return (
      <div className="demand-page">
        <div className="demand-card">
          <h1>Buyer Demand</h1>
          <p>Only buyers can post demands.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demand-page">
      <div className="demand-container">
        {!selected ? (
          <>
            <div className="demand-header">
              <p className="section-label">BULK DEMAND</p>
              <h1>Post a Requirement</h1>
              <p>
                Tell farmers what you need, where it should arrive and by when.
              </p>
            </div>

            {message && (
              <div className="demand-message-box">{message}</div>
            )}

            <div className="demand-card">
              <form onSubmit={submit}>
                <div className="form-grid">
                  <label>
                    Crop
                    <input
                      name="crop_name"
                      value={form.crop_name}
                      onChange={change}
                      required
                    />
                  </label>

                  <label>
                    Required Quantity
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      name="required_quantity"
                      value={form.required_quantity}
                      onChange={change}
                      required
                    />
                  </label>
                </div>

                {/* Autocomplete Location Picker for Delivery Destination */}
                <LocationPicker
                  label="Delivery Destination"
                  placeholder="Search delivery place (e.g. Mumbai Wholesale Market, Vashi APMC)..."
                  initialAddress={form.delivery_address || form.destination}
                  initialLat={form.delivery_lat}
                  initialLng={form.delivery_lng}
                  required
                  onChange={({ address, lat, lng }) => {
                    setForm((prev) => ({
                      ...prev,
                      destination: address ? address.split(",")[0].trim() : prev.destination,
                      delivery_address: address,
                      delivery_lat: lat,
                      delivery_lng: lng,
                    }));
                  }}
                />

                <div className="form-grid">
                  <label>
                    Required Date
                    <input
                      type="date"
                      name="required_date"
                      value={form.required_date}
                      onChange={change}
                      required
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Contact Name
                    <input
                      name="delivery_contact_name"
                      value={form.delivery_contact_name}
                      onChange={change}
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="delivery_phone"
                      value={form.delivery_phone}
                      onChange={change}
                      required
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Max Price / KG
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="max_price_per_unit"
                      value={form.max_price_per_unit}
                      onChange={change}
                    />
                  </label>

                  <label>
                    Unit
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={change}
                    >
                      <option value="KG">KG</option>
                      <option value="QUINTAL">QUINTAL</option>
                      <option value="TON">TON</option>
                    </select>
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    Preferred Size
                    <select
                      name="preferred_size"
                      value={form.preferred_size}
                      onChange={change}
                    >
                      <option value="ANY">ANY</option>
                      <option value="SMALL">SMALL</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LARGE">LARGE</option>
                    </select>
                  </label>

                  <label>
                    Quality
                    <select
                      name="preferred_quality"
                      value={form.preferred_quality}
                      onChange={change}
                    >
                      <option value="ANY">ANY</option>
                      <option value="GRADE_A">GRADE A</option>
                      <option value="GRADE_B">GRADE B</option>
                    </select>
                  </label>
                </div>

                <label>
                  Condition
                  <select
                    name="preferred_condition"
                    value={form.preferred_condition}
                    onChange={change}
                  >
                    <option value="ANY">ANY</option>
                    <option value="FRESH">FRESH</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </label>

                <label className="mixed-checkbox">
                  <input
                    type="checkbox"
                    name="allow_mixed"
                    checked={form.allow_mixed}
                    onChange={change}
                  />
                  Allow supply from multiple farmers
                </label>

                <button type="submit" disabled={loading}>
                  {loading ? "Posting..." : "Post Demand"}
                </button>
              </form>
            </div>

            {demands.length > 0 && (
              <>
                <div className="demand-header">
                  <p className="section-label">MY REQUIREMENTS</p>
                  <h1>Find Farmer Supply</h1>
                </div>

                <div className="farmer-demand-grid">
                  {demands.map((demand) => (
                    <div className="farmer-demand-card" key={demand.id}>
                      <span className="product-status">{demand.status}</span>
                      <h2>{demand.crop_name}</h2>
                      <p>
                        Required: {" "}
                        <strong>
                          {demand.required_quantity} {demand.unit}
                        </strong>
                      </p>
                      <p>
                        Destination: <strong>{demand.destination}</strong>
                      </p>
                      <p>
                        Address: <strong>{demand.delivery_address}</strong>
                      </p>
                      <p>
                        By: <strong>{demand.required_date}</strong>
                      </p>
                      <button
                        className="interest-button"
                        onClick={() => find(demand)}
                      >
                        Find Matching Farmers
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <button
              className="back-button"
              onClick={() => setSelected(null)}
            >
              ← Back to My Demands
            </button>

            <div className="demand-header">
              <p className="section-label">SMART MATCHING</p>
              <h1>
                {selected.crop_name} • {selected.required_quantity} {selected.unit}
              </h1>
              <p>
                {selected.destination} • {selected.delivery_date || selected.required_date} • {selected.delivery_address}
              </p>
            </div>

            {message && (
              <div className="demand-message-box">{message}</div>
            )}

            {summary && (
              <div className="matching-summary">
                <div>
                  <span>Required</span>
                  <strong>{summary.required_quantity}</strong>
                </div>
                <div>
                  <span>Matched</span>
                  <strong>{summary.matched_quantity}</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>{summary.remaining_quantity}</strong>
                </div>
                <div>
                  <span>Match</span>
                  <strong>{summary.match_percentage}%</strong>
                </div>
              </div>
            )}

            {matches.length === 0 ? (
              <div className="empty-marketplace">
                <h2>No compatible farmers found</h2>
                <p>Try a wider price or quality preference.</p>
              </div>
            ) : (
              <div className="offer-grid">
                {matches.map((product) => (
                  <div className="offer-card" key={product.id}>
                    {product.image_url && (
                      <img
                        src={`${API}${product.image_url}`}
                        alt={product.crop_name}
                        className="offer-image"
                      />
                    )}

                    <div className="offer-card-top">
                      <span className="product-status">MATCH</span>
                      <span className="product-location">
                        {product.location}
                      </span>
                    </div>

                    <h2>{product.farmer_name}</h2>

                    <div className="offer-details">
                      <div>
                        <span>Available</span>
                        <strong>
                          {product.quantity} {product.unit}
                        </strong>
                      </div>
                      <div>
                        <span>Matched</span>
                        <strong>
                          {product.matched_quantity} {product.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="offer-note">
                      <span>Price</span>
                      <p>
                        <strong>
                          ₹{Number(product.price_per_unit).toFixed(2)}/
                          {product.unit}
                        </strong>
                      </p>
                    </div>

                    <button
                      className="interest-button"
                      onClick={() => sendOffer(product)}
                    >
                      Request Supply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BuyerDemand;
