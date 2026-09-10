import { useEffect, useState } from "react";
import { API } from "../config";

function BuyerOffers() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [requests, setRequests] = useState([]);
  const [demands, setDemands] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [offers, setOffers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [requestResponse, demandResponse] = await Promise.all([
        fetch(`${API}/api/buyers/${user.id}/requests`),
        fetch(`${API}/api/demands`),
      ]);

      const requestData = await requestResponse.json();
      const demandData = await demandResponse.json();

      if (requestResponse.ok) setRequests(requestData);
      if (demandResponse.ok) {
        setDemands(
          demandData.filter((item) => Number(item.buyer_id) === Number(user.id))
        );
      }
    } catch (error) {
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "BUYER") load();
    else setLoading(false);
  }, []);

  const cancelDirectRequest = async (requestId) => {
    try {
      const response = await fetch(
        `${API}/api/buyer-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            buyer_id: user.id,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      load();
    } catch (error) {
      setMessage(error.message || "Unable to cancel request.");
    }
  };

  const openOffers = async (demand) => {
    setSelectedDemand(demand);
    setOffers([]);
    try {
      const response = await fetch(`${API}/api/demands/${demand.id}/offers`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setOffers(data);
    } catch (error) {
      setMessage(error.message || "Unable to load farmer offers.");
    }
  };

  const updateOffer = async (offerId, status) => {
    try {
      const response = await fetch(
        `${API}/api/supply-offers/${offerId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      if (selectedDemand) await openOffers(selectedDemand);
      load();
    } catch (error) {
      setMessage(error.message || "Unable to update offer.");
    }
  };

  if (user?.role !== "BUYER") {
    return (
      <div className="demand-page">
        <div className="demand-card">
          <h1>My Requests</h1>
          <p>Only buyers can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demand-page">
      <div className="demand-container">
        <div className="demand-header">
          <p className="section-label">DIRECT REQUESTS</p>
          <h1>My Supply Requests</h1>
          <p>
            Follow direct requests to farmers and review responses from the
            older buyer-demand matching flow.
          </p>
        </div>

        {message && <div className="demand-message-box">{message}</div>}

        {loading ? (
          <div className="empty-marketplace"><p>Loading...</p></div>
        ) : requests.length === 0 ? (
          <div className="empty-marketplace">
            <h2>No direct requests</h2>
            <p>Open Marketplace and request an exact quantity from a listing.</p>
          </div>
        ) : (
          <div className="offer-grid">
            {requests.map((request) => (
              <div className="offer-card" key={request.id}>
                {request.image_url && (
                  <img
                    src={`${API}${request.image_url}`}
                    alt={request.crop_name}
                    className="offer-image"
                  />
                )}

                <div className="offer-card-top">
                  <span className="product-status">{request.status}</span>
                  <span className="product-location">{request.location}</span>
                </div>

                <h2>{request.crop_name}</h2>

                <div className="offer-details">
                  <div>
                    <span>Requested</span>
                    <strong>{request.requested_quantity} {request.unit}</strong>
                  </div>
                  <div>
                    <span>Price</span>
                    <strong>₹{Number(request.offered_price_per_unit).toFixed(2)}/{request.unit}</strong>
                  </div>
                </div>

                <div className="offer-note">
                  <span>Farmer Contact</span>
                  <p>
                    <strong>{request.farmer_name}</strong> • {request.farmer_phone || "Not available"}
                  </p>
                  {request.farmer_phone && (
                    <a href={`tel:${request.farmer_phone}`}>Call Farmer</a>
                  )}
                </div>

                <div className="offer-note">
                  <span>Delivery</span>
                  <p>{request.delivery_city || request.destination}</p>
                  <p>{request.delivery_address || "Address stored with order request."}</p>
                </div>

                {request.status === "PENDING" && (
                  <button
                    className="secondary-action"
                    onClick={() => cancelDirectRequest(request.id)}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {demands.length > 0 && !selectedDemand && (
          <>
            <div className="request-section-heading">
              <div>
                <p className="section-label">LEGACY MATCHING</p>
                <h2>Farmer Supply Offers</h2>
              </div>
            </div>
            <div className="farmer-demand-grid">
              {demands.map((demand) => (
                <div className="farmer-demand-card" key={demand.id}>
                  <span className="product-status">{demand.status}</span>
                  <h2>{demand.crop_name}</h2>
                  <p>{demand.required_quantity} {demand.unit} → {demand.destination}</p>
                  <button className="interest-button" onClick={() => openOffers(demand)}>
                    View Farmer Offers
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedDemand && (
          <div className="order-detail-panel">
            <div className="order-detail-header">
              <div>
                <p className="section-label">DEMAND #{selectedDemand.id}</p>
                <h2>{selectedDemand.crop_name} • {selectedDemand.required_quantity} {selectedDemand.unit}</h2>
                <p>{selectedDemand.destination} • {selectedDemand.delivery_address}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedDemand(null)}>×</button>
            </div>

            {offers.length === 0 ? (
              <div className="empty-marketplace"><p>No farmer offers yet.</p></div>
            ) : (
              <div className="offer-grid">
                {offers.map((offer) => (
                  <div className="offer-card" key={offer.id}>
                    {offer.image_url && <img src={`${API}${offer.image_url}`} alt={offer.crop_name} className="offer-image" />}
                    <div className="offer-card-top">
                      <span className="product-status">{offer.status}</span>
                      <span className="product-location">{offer.location}</span>
                    </div>
                    <h2>{offer.farmer_name}</h2>
                    <div className="offer-details">
                      <div><span>Supply</span><strong>{offer.offered_quantity} {offer.unit}</strong></div>
                      <div><span>Price</span><strong>₹{Number(offer.offered_price_per_unit).toFixed(2)}/{offer.unit}</strong></div>
                    </div>
                    <div className="offer-note">
                      <span>Farmer Contact</span>
                      <p>{offer.farmer_phone || "Not available"}</p>
                      {offer.farmer_phone && <a href={`tel:${offer.farmer_phone}`}>Call Farmer</a>}
                    </div>
                    {offer.message && <div className="offer-note"><span>Farmer Message</span><p>{offer.message}</p></div>}
                    {offer.status === "PENDING" && (
                      <div className="offer-actions">
                        <button onClick={() => updateOffer(offer.id, "ACCEPTED")}>Accept Offer</button>
                        <button className="reject-offer" onClick={() => updateOffer(offer.id, "REJECTED")}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerOffers;
