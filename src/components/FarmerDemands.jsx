import { useEffect, useState } from "react";
import { API } from "../config";

function FarmerDemands() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [direct, setDirect] = useState([]);
  const [offers, setOffers] = useState([]);
  const [openDemands, setOpenDemands] = useState([]);
  const [products, setProducts] = useState([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedDemand, setSelectedDemand] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [offerQuantity, setOfferQuantity] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    if (user?.role === "FARMER") {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [directRes, offersRes, demandsRes, productsRes] =
        await Promise.all([
          fetch(`${API}/api/farmers/${user.id}/buyer-requests`),
          fetch(`${API}/api/farmers/${user.id}/requests`),
          fetch(`${API}/api/farmers/${user.id}/open-demands`),
          fetch(`${API}/api/products`),
        ]);

      const [directData, offersData, demandsData, productsData] =
        await Promise.all([
          directRes.json(),
          offersRes.json(),
          demandsRes.json(),
          productsRes.json(),
        ]);

      if (directRes.ok) setDirect(directData);
      if (offersRes.ok) setOffers(offersData);
      if (demandsRes.ok) setOpenDemands(demandsData);

      if (productsRes.ok) {
        setProducts(
          productsData.filter(
            (product) =>
              Number(product.farmer_id) === Number(user.id) &&
              product.status === "AVAILABLE" &&
              Number(product.quantity) > 0
          )
        );
      }

      if (
        !directRes.ok &&
        !offersRes.ok &&
        !demandsRes.ok &&
        !productsRes.ok
      ) {
        setMessage("Unable to load farmer dashboard.");
      }
    } catch (error) {
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const updateDirectRequest = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/api/buyer-requests/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            farmer_id: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update request.");
      }

      setMessage(data.message);
      await fetchAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const openOfferModal = (demand) => {
    setSelectedDemand(demand);
    setSelectedProduct(null);
    setOfferQuantity("");
    setOfferPrice("");
    setOfferMessage("");
    setMessage("");
  };

  const closeOfferModal = () => {
    setSelectedDemand(null);
    setSelectedProduct(null);
    setOfferQuantity("");
    setOfferPrice("");
    setOfferMessage("");
  };

  const handleProductChange = (e) => {
    const productId = Number(e.target.value);

    const product =
      products.find((item) => Number(item.id) === productId) || null;

    setSelectedProduct(product);

    if (product) {
      setOfferPrice(product.price_per_unit);
    } else {
      setOfferPrice("");
    }
  };

  const sendOffer = async (e) => {
    e.preventDefault();

    if (!selectedDemand) {
      return;
    }

    if (!selectedProduct) {
      setMessage("Please select one of your listings.");
      return;
    }

    const quantity = Number(offerQuantity);
    const remaining = Number(selectedDemand.remaining_quantity);
    const stock = Number(selectedProduct.quantity);

    if (!quantity || quantity <= 0) {
      setMessage("Enter a valid supply quantity.");
      return;
    }

    if (quantity > stock) {
      setMessage(
        `You only have ${stock} ${selectedProduct.unit} available.`
      );
      return;
    }

    if (quantity > remaining) {
      setMessage(
        `This buyer still needs only ${remaining} ${selectedDemand.unit}.`
      );
      return;
    }

    try {
      const response = await fetch(`${API}/api/supply-offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demand_id: selectedDemand.id,
          farmer_id: user.id,
          product_id: selectedProduct.id,
          offered_quantity: quantity,
          offered_price_per_unit:
            Number(offerPrice) ||
            Number(selectedProduct.price_per_unit),
          message:
            offerMessage ||
            `I can supply ${quantity} ${selectedProduct.unit}.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send supply offer."
        );
      }

      setMessage(
        "Supply offer sent successfully. The buyer can now review it."
      );

      closeOfferModal();
      await fetchAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (user?.role !== "FARMER") {
    return (
      <div className="demand-page">
        <div className="demand-card">
          <h1>Buyer Requests</h1>
          <p>Only farmers can view incoming buyer requirements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demand-page">
      <div className="demand-container">

        <div className="demand-header">
          <p className="section-label">FARMER INBOX</p>

          <h1>Buyer Requests</h1>

          <p>
            View open buyer requirements, offer your available produce,
            and manage direct marketplace requests.
          </p>
        </div>

        {message && (
          <div className="demand-message-box">
            {message}
          </div>
        )}

        {loading ? (
          <div className="empty-marketplace">
            <p>Loading farmer requests...</p>
          </div>
        ) : (
          <>
            {/* =====================================================
                OPEN BUYER DEMANDS
            ===================================================== */}

            <div className="request-section-heading">
              <div>
                <p className="section-label">
                  OPEN MARKET DEMAND
                </p>

                <h2>Buyer Requirements</h2>
              </div>

              <span>
                {openDemands.length} open
              </span>
            </div>

            {openDemands.length === 0 ? (
              <div className="empty-marketplace">
                <h2>No open buyer demands</h2>
                <p>
                  New bulk requirements posted by buyers will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="offer-grid">
                {openDemands.map((demand) => (
                  <div
                    className="offer-card"
                    key={`demand-${demand.id}`}
                  >
                    <div className="offer-card-top">
                      <span className="product-status">
                        {demand.status}
                      </span>

                      <span className="product-location">
                        {demand.destination}
                      </span>
                    </div>

                    <h2>{demand.crop_name}</h2>

                    <div className="offer-details">
                      <div>
                        <span>Total Required</span>

                        <strong>
                          {demand.required_quantity}{" "}
                          {demand.unit}
                        </strong>
                      </div>

                      <div>
                        <span>Still Needed</span>

                        <strong>
                          {demand.remaining_quantity}{" "}
                          {demand.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="offer-specifications">

                      <p>
                        <span>Max Price</span>

                        <strong>
                          {demand.max_price_per_unit
                            ? `₹${Number(
                                demand.max_price_per_unit
                              ).toFixed(2)}/${demand.unit}`
                            : "Negotiable"}
                        </strong>
                      </p>

                      <p>
                        <span>Delivery</span>

                        <strong>
                          {demand.destination}
                        </strong>
                      </p>

                      <p>
                        <span>Required Date</span>

                        <strong>
                          {demand.required_date}
                        </strong>
                      </p>

                      <p>
                        <span>Supply Mode</span>

                        <strong>
                          {demand.allow_mixed
                            ? "Multiple Farmers"
                            : "Single Farmer"}
                        </strong>
                      </p>

                    </div>

                    <div className="offer-note">
                      <span>Buyer</span>

                      <p>
                        <strong>
                          {demand.buyer_name}
                        </strong>
                      </p>

                      <p>
                        Contact:{" "}
                        {demand.buyer_phone ||
                          demand.buyer_profile_phone ||
                          "Not provided"}
                      </p>

                      <p>
                        Address:{" "}
                        <strong>
                          {demand.delivery_address ||
                            "Address not provided"}
                        </strong>
                      </p>
                    </div>

                    <button
                      className="interest-button"
                      onClick={() =>
                        openOfferModal(demand)
                      }
                    >
                      Offer My Supply
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* =====================================================
                DIRECT MARKETPLACE REQUESTS
            ===================================================== */}

            <div className="request-section-heading">
              <div>
                <p className="section-label">
                  DIRECT MARKETPLACE
                </p>

                <h2>Requests for Your Listings</h2>
              </div>

              <span>
                {
                  direct.filter(
                    (x) => x.status === "PENDING"
                  ).length
                }{" "}
                pending
              </span>
            </div>

            {direct.length === 0 ? (
              <div className="empty-marketplace">
                <h2>No direct buyer requests</h2>

                <p>
                  Requests from Marketplace will appear here.
                </p>
              </div>
            ) : (
              <div className="offer-grid">
                {direct.map((r) => (
                  <div
                    className="offer-card"
                    key={`direct-${r.id}`}
                  >
                    {r.image_url && (
                      <img
                        src={`${API}${r.image_url}`}
                        alt={r.crop_name}
                        className="offer-image"
                      />
                    )}

                    <div className="offer-card-top">
                      <span className="product-status">
                        {r.status}
                      </span>

                      <span className="product-location">
                        {r.location}
                      </span>
                    </div>

                    <h2>{r.crop_name}</h2>

                    <div className="offer-details">
                      <div>
                        <span>Buyer Requests</span>

                        <strong>
                          {Number(
                            r.requested_quantity
                          ).toFixed(2)}{" "}
                          {r.unit}
                        </strong>
                      </div>

                      <div>
                        <span>Stock Now</span>

                        <strong>
                          {Number(
                            r.available_quantity
                          ).toFixed(2)}{" "}
                          {r.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="offer-specifications">
                      <p>
                        <span>Order Value</span>

                        <strong>
                          ₹
                          {(
                            Number(
                              r.requested_quantity
                            ) *
                            Number(
                              r.offered_price_per_unit
                            )
                          ).toFixed(2)}
                        </strong>
                      </p>

                      <p>
                        <span>Pickup</span>

                        <strong>
                          {r.location}
                        </strong>
                      </p>

                      <p>
                        <span>Delivery</span>

                        <strong>
                          {r.delivery_city}
                        </strong>
                      </p>

                      <p>
                        <span>Delivery Date</span>

                        <strong>
                          {r.required_date}
                        </strong>
                      </p>
                    </div>

                    <div className="offer-note">
                      <span>Buyer & Contact</span>

                      <p>
                        <strong>
                          {r.buyer_name}
                        </strong>{" "}
                        •{" "}
                        {r.delivery_phone ||
                          r.buyer_profile_phone ||
                          "No phone"}
                      </p>

                      <p>
                        {r.delivery_contact_name}
                      </p>

                      <p>
                        {r.delivery_address}
                      </p>
                    </div>

                    {r.message && (
                      <div className="offer-note">
                        <span>Buyer Message</span>

                        <p>
                          {r.message}
                        </p>
                      </div>
                    )}

                    {r.status === "PENDING" && (
                      <div className="offer-actions">
                        <button
                          onClick={() =>
                            updateDirectRequest(
                              r.id,
                              "ACCEPTED"
                            )
                          }
                        >
                          Accept Request
                        </button>

                        <button
                          className="reject-offer"
                          onClick={() =>
                            updateDirectRequest(
                              r.id,
                              "REJECTED"
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {r.status === "ACCEPTED" && (
                      <div className="success-box">
                        ✓ Order created
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* =====================================================
                OLD SUPPLY OFFER FLOW
            ===================================================== */}

            {offers.length > 0 && (
              <>
                <div className="request-section-heading legacy-supply-section">
                  <div>
                    <p className="section-label">
                      BUYER DEMAND FLOW
                    </p>

                    <h2>Your Supply Offers</h2>
                  </div>
                </div>

                <div className="offer-grid">
                  {offers.map((r) => (
                    <div
                      className="offer-card"
                      key={`legacy-${r.id}`}
                    >
                      {r.image_url && (
                        <img
                          src={`${API}${r.image_url}`}
                          alt={r.crop_name}
                          className="offer-image"
                        />
                      )}

                      <div className="offer-card-top">
                        <span className="product-status">
                          {r.status}
                        </span>

                        <span className="product-location">
                          {r.destination}
                        </span>
                      </div>

                      <h2>{r.crop_name}</h2>

                      <div className="offer-details">
                        <div>
                          <span>Buyer Needs</span>

                          <strong>
                            {r.required_quantity}{" "}
                            {r.unit}
                          </strong>
                        </div>

                        <div>
                          <span>Your Supply</span>

                          <strong>
                            {r.offered_quantity}{" "}
                            {r.unit}
                          </strong>
                        </div>
                      </div>

                      <div className="offer-note">
                        <span>Buyer</span>

                        <p>
                          <strong>
                            {r.buyer_name}
                          </strong>{" "}
                          •{" "}
                          {r.buyer_phone ||
                            "No phone"}
                        </p>

                        <p>
                          {r.delivery_address ||
                            r.destination}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* =====================================================
            OFFER MODAL
        ===================================================== */}

        {selectedDemand && (
          <div className="modal-overlay">
            <div className="request-modal">

              <div className="request-modal-header">
                <div>
                  <p className="section-label">
                    SUPPLY OFFER
                  </p>

                  <h2>
                    {selectedDemand.crop_name}
                  </h2>

                  <p>
                    Buyer still needs{" "}
                    <strong>
                      {selectedDemand.remaining_quantity}{" "}
                      {selectedDemand.unit}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeOfferModal}
                >
                  ×
                </button>
              </div>

              <form onSubmit={sendOffer}>

                <div className="form-group">
                  <label>
                    Select Your Listing
                  </label>

                  <select
                    value={selectedProduct?.id || ""}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">
                      Select available produce
                    </option>

                    {products
                      .filter(
                        (p) =>
                          p.crop_name?.toLowerCase() ===
                            selectedDemand.crop_name?.toLowerCase() &&
                          p.unit === selectedDemand.unit
                      )
                      .map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.crop_name} —{" "}
                          {product.quantity}{" "}
                          {product.unit} — ₹
                          {Number(
                            product.price_per_unit
                          ).toFixed(2)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="request-product-summary">
                  <div>
                    <span>Buyer Needs</span>

                    <strong>
                      {selectedDemand.remaining_quantity}{" "}
                      {selectedDemand.unit}
                    </strong>
                  </div>

                  <div>
                    <span>Your Stock</span>

                    <strong>
                      {selectedProduct
                        ? `${selectedProduct.quantity} ${selectedProduct.unit}`
                        : "Select listing"}
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Supply Quantity
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      selectedProduct
                        ? Math.min(
                            Number(
                              selectedProduct.quantity
                            ),
                            Number(
                              selectedDemand.remaining_quantity
                            )
                          )
                        : undefined
                    }
                    value={offerQuantity}
                    onChange={(e) =>
                      setOfferQuantity(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Your Price / {selectedDemand.unit}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={offerPrice}
                    onChange={(e) =>
                      setOfferPrice(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Message to Buyer
                  </label>

                  <textarea
                    rows="4"
                    value={offerMessage}
                    onChange={(e) =>
                      setOfferMessage(
                        e.target.value
                      )
                    }
                    placeholder="Example: I can supply fresh Grade A tomatoes from Nashik."
                  />
                </div>

                {message && (
                  <div className="demand-message-box">
                    {message}
                  </div>
                )}

                <div className="request-modal-actions">
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={closeOfferModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="marketplace-action"
                  >
                    Send Supply Offer
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDemands;