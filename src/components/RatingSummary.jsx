import { useEffect, useState } from "react";
import { API } from "../config";

function StarDisplay({ rating, size = "sm" }) {
  const filled = Math.round(rating || 0);
  return (
    <span className={`star-display star-display--${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </span>
  );
}

function RatingSummary({ userId, inline = false }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/api/users/${userId}/rating-summary`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSummary(d);
      })
      .catch(() => {});
  }, [userId]);

  if (!summary || summary.total_ratings === 0) {
    return (
      <span className={`rating-summary rating-summary--empty${inline ? " inline" : ""}`}>
        <span className="star-display star-display--sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="star">★</span>
          ))}
        </span>
        <span className="rating-count">No ratings yet</span>
      </span>
    );
  }

  return (
    <span className={`rating-summary${inline ? " inline" : ""}`}>
      <StarDisplay rating={summary.average_rating} />
      <span className="rating-score">{summary.average_rating}</span>
      <span className="rating-count">({summary.total_ratings} rating{summary.total_ratings !== 1 ? "s" : ""})</span>
    </span>
  );
}

export { StarDisplay };
export default RatingSummary;
