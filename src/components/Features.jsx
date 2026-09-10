import { Link } from "react-router-dom";

function Features() {
  const features = [
    {
      number: "01",
      title: "Direct Marketplace",
      description:
        "Farmers can list produce and reach consumers, retailers, restaurants and bulk buyers directly.",
      link: "/marketplace",
      action: "View marketplace",
    },
    {
      number: "02",
      title: "Market Intelligence",
      description:
        "Compare indicative prices, demand levels, trends and transport impact before choosing a market.",
      link: "/market-intelligence",
      action: "Compare markets",
    },
    {
      number: "03",
      title: "Smart Logistics",
      description:
        "Combine accepted farmer supplies into one delivery route and divide transport costs fairly.",
      link: "/logistics",
      action: "Open logistics",
    },
    {
      number: "04",
      title: "Buyer Demand",
      description:
        "Buyers can post crop, quantity, quality and destination requirements for farmers to respond to.",
      link: "/buyer-demand",
      action: "Post a demand",
    },
    {
      number: "05",
      title: "Smart Matching",
      description:
        "Match buyer requirements with compatible farmer supplies before confirming a supply offer.",
      link: "/marketplace",
      action: "Explore flow",
    },
    {
      number: "06",
      title: "Farmer Requests",
      description:
        "Farmers receive buyer supply requests and can accept or reject them before logistics planning.",
      link: "/farmer-demands",
      action: "View requests",
    },
  ];

  return (
    <section className="features-section" id="features">
      <div className="section-heading">
        <p className="section-tag">WHAT THE PLATFORM DOES</p>
        <h2>One workflow from demand to delivery.</h2>
        <p>
          The prototype focuses on the problem statement's core journey:
          direct market linkage, market visibility and lower-cost transport.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <div className="feature-number">{feature.number}</div>
            <div className="feature-copy">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <Link to={feature.link} className="feature-link">
                {feature.action} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Features;
