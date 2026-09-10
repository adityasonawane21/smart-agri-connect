import { useState } from "react";
import { API } from "../config";

function RatingModal({ order, currentUser, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!order || !currentUser) return null;

  const isBuyer = currentUser.role === "BUYER";
  const ratedPersonName = isBuyer ? order.farmer_name : order.buyer_name;

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating between 1 and 5.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          reviewer_id: currentUser.id,
          reviewer_role: currentUser.role,
          rating,
          review: review.trim() || null,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) {
        throw new Error(
          data?.message ||
            "The rating service is temporarily unavailable. Please wait a moment and try again."
        );
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rating-modal-header">
          <div>
            <p className="section-label">{order.order_code}</p>
            <h2>Rate {isBuyer ? "Farmer" : "Buyer"}</h2>
            <p className="rating-modal-subtitle">
              How was your experience with <strong>{ratedPersonName}</strong>?
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="rating-modal-body">
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star-btn${star <= (hovered || rating) ? " selected" : ""}`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} star`}
                disabled={loading}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="rating-label-text">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </p>
          )}

          <div className="order-meta" style={{ marginTop: "1rem" }}>
            <p><span>Order</span><strong>{order.order_code}</strong></p>
            <p><span>Crop</span><strong>{order.crop_name}</strong></p>
            <p><span>Quantity</span><strong>{Number(order.quantity).toFixed(0)} {order.unit}</strong></p>
          </div>

          <textarea
            className="review-textarea"
            placeholder="Write a review... (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            maxLength={500}
            rows={3}
          />

          {error && <div className="error-box">{error}</div>}

          <div className="rating-modal-actions">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="interest-button"
              onClick={submit}
              disabled={loading || rating === 0}
            >
              {loading ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
