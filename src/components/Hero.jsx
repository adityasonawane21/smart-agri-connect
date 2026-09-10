import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-tag">FARMER FIRST • MARKET CONNECT</p>

        <h1>Better prices start with better market access.</h1>

        <p className="hero-subtitle">
          Smart Agri Connect connects farmers directly with buyers and helps
          move produce at a lower logistics cost.
        </p>

        <p className="hero-description">
          List produce, respond to buyer demand, compare market opportunities,
          and build shared delivery routes — all in one platform.
        </p>

        <div className="hero-buttons">
          <Link to="/marketplace" className="hero-primary-button">
            Explore Marketplace
          </Link>
          <Link to="/register" className="hero-secondary-button">
            Create an Account
          </Link>
        </div>

        <div className="hero-trust-row">
          <span>✓ Direct buyer access</span>
          <span>✓ Demand & price signals</span>
          <span>✓ Shared logistics</span>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-panel">
          <div className="hero-panel-top">
            <span className="hero-panel-label">MARKET SNAPSHOT</span>
            <span className="hero-live-dot">LIVE DEMO</span>
          </div>

          <div className="hero-market-row hero-market-row-main">
            <div>
              <span>Onion • Mumbai</span>
              <strong>₹32 / KG</strong>
            </div>
            <span className="hero-badge">HIGH DEMAND</span>
          </div>

          <div className="hero-mini-grid">
            <div>
              <span>Buyer demand</span>
              <strong>1,000 KG</strong>
            </div>
            <div>
              <span>Shared trip</span>
              <strong>3 Farmers</strong>
            </div>
          </div>

          <div className="hero-route-card">
            <div className="hero-route-line" />
            <div className="hero-route-stops">
              <span>Nashik</span>
              <span>Pune</span>
              <span>Thane</span>
              <span>Mumbai</span>
            </div>
            <p>One consolidated route • fair cost sharing</p>
          </div>
        </div>

        <div className="hero-floating-card">
          <strong>More value stays with the farmer.</strong>
          <span>Direct market linkage + efficient delivery.</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
