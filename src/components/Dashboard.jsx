import { Link } from "react-router-dom";
function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const farmer = user?.role === "FARMER";
  const cards = farmer
    ? [
        { title: "My Listings", text: "Publish produce and manage remaining stock.", to: "/marketplace" },
        { title: "Buyer Requests", text: "Accept or reject incoming quantity requests.", to: "/farmer-demands" },
        { title: "My Sales & Live Tracking", text: "Track delivery route, update live GPS, and manage order statuses.", to: "/orders", highlight: true },
        { title: "Smart Logistics", text: "See shared shipments, route map and transport split.", to: "/logistics" },
        { title: "Market Intelligence", text: "Check APMC Mandi prices, demand trends and forecasts.", to: "/market-intelligence" },
      ]
    : [
        { title: "Marketplace", text: "Browse farmer listings and request exact quantities.", to: "/marketplace" },
        { title: "Buyer Demand", text: "Post larger requirements and allow multiple farmers.", to: "/buyer-demand" },
        { title: "My Orders & Live Tracking", text: "Live polyline tracking per farmer, shipment status, and ratings.", to: "/orders", highlight: true },
        { title: "Smart Logistics", text: "View the consolidated route for shared shipments.", to: "/logistics" },
        { title: "Market Intelligence", text: "Check market prices and crop analytics.", to: "/market-intelligence" },
      ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <div>
            <p className="section-label">YOUR WORKSPACE</p>
            <h1>Welcome, {user?.name || "User"}</h1>
            <p className="dashboard-subtitle">
              {farmer
                ? "Manage listings, buyer requests, sales and transport."
                : "Manage requirements, direct farmer requests, orders and delivery."}
            </p>
          </div>
          <span className="dashboard-role-pill">{farmer ? "FARMER" : "BUYER"}</span>
        </div>

        <div className="dashboard-grid">
          {cards.map((c, i) => (
            <Link
              to={c.to}
              className={`dashboard-card${c.highlight ? " dashboard-card--highlight" : ""}`}
              key={c.title}
            >
              <span className="dashboard-card-number">{String(i + 1).padStart(2, "0")}</span>
              <h2>{c.title}</h2>
              <p>{c.text}</p>
              <span className="dashboard-card-arrow">Open →</span>
            </Link>
          ))}
        </div>

        <div className="dashboard-footer-note">
          <strong>Smart Agri Connect</strong>
          <span>Direct markets • Better visibility • Shared logistics • Live tracking</span>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
