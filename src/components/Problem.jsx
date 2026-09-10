function Problem() {
  const chain = [
    "Farmer",
    "Middleman",
    "Wholesaler",
    "Distributor",
    "Retailer",
    "Consumer",
  ];

  return (
    <section className="problem-section">
      <div className="section-heading">
        <p className="section-tag">THE PROBLEM</p>
        <h2>Too many layers weaken farmer earnings and increase consumer prices.</h2>
        <p>
          Smart Agri Connect targets the avoidable layers in the supply chain
          by bringing supply, demand and delivery decisions closer together.
        </p>
      </div>

      <div className="problem-flow">
        {chain.map((item, index) => (
          <div className="problem-flow-item" key={item}>
            <div className="problem-step">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
            </div>
            {index < chain.length - 1 && <div className="arrow">→</div>}
          </div>
        ))}
      </div>

      <div className="problem-points">
        <div>
          <span>01</span>
          <div>
            <strong>Lower farmer realization</strong>
            <p>Limited buyer access and bargaining power.</p>
          </div>
        </div>
        <div>
          <span>02</span>
          <div>
            <strong>Higher consumer price</strong>
            <p>Multiple margins accumulate across the chain.</p>
          </div>
        </div>
        <div>
          <span>03</span>
          <div>
            <strong>Expensive, fragmented delivery</strong>
            <p>Independent trips increase avoidable logistics cost.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Problem;
