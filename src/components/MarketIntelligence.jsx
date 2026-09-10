import { useEffect, useState } from "react";
import { API } from "../config";

function MarketIntelligence() {
  const [crop, setCrop] = useState("onion");
  const [origin, setOrigin] = useState("Nashik");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const crops = ["onion", "tomato", "potato"];

  const locations = [
    "Nashik",
    "Pune",
    "Mumbai",
    "Thane",
    "Nagpur",
  ];

  const distanceMap = {
    Nashik: {
      Mumbai: 170,
      Pune: 210,
      Nashik: 10,
      Thane: 155,
      Nagpur: 650,
    },
    Pune: {
      Mumbai: 150,
      Pune: 10,
      Nashik: 210,
      Thane: 145,
      Nagpur: 720,
    },
    Mumbai: {
      Mumbai: 10,
      Pune: 150,
      Nashik: 170,
      Thane: 35,
      Nagpur: 840,
    },
    Thane: {
      Mumbai: 35,
      Pune: 145,
      Nashik: 155,
      Thane: 10,
      Nagpur: 830,
    },
    Nagpur: {
      Mumbai: 840,
      Pune: 720,
      Nashik: 650,
      Thane: 830,
      Nagpur: 10,
    },
  };

  useEffect(() => {
    fetchMarketData();
  }, [crop]);

  const fetchMarketData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/market-intelligence?crop=${crop}`
      );

      const result = await response.json();

      if (!response.ok) {
        setData(null);
        setMessage(
          result.message || "Unable to load market data."
        );
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);

      setData(null);
      setMessage(
        "Unable to connect to market intelligence service."
      );
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (marketLocation) => {
    return (
      distanceMap[origin]?.[marketLocation] ?? 50
    );
  };

  const getTransportCost = (marketLocation) => {
    const distance = getDistance(marketLocation);

    return distance * 12;
  };

  const getNetValue = (market) => {
    const price = Number(market.price_per_kg);
    const transport = getTransportCost(
      market.market_location
    );

    return Math.max(
      price * 100 - transport,
      0
    );
  };

  const getRankingScore = (market) => {
    const priceScore =
      Number(market.price_per_kg);

    const demandScore =
      Number(market.demand_score) * 0.1;

    const distancePenalty =
      getDistance(
        market.market_location
      ) * 0.015;

    return (
      priceScore +
      demandScore -
      distancePenalty
    );
  };

  const rankedMarkets = data?.markets
    ? [...data.markets].sort(
        (a, b) =>
          getRankingScore(b) -
          getRankingScore(a)
      )
    : [];

  return (
    <div className="market-intelligence-page">
      <div className="market-intelligence-container">

        <div className="market-intelligence-header">
          <p className="section-label">
            MARKET INTELLIGENCE
          </p>

          <h1>
            Know Where to Sell
          </h1>

          <p>
            Compare market prices, demand and
            transport before choosing your
            destination.
          </p>
        </div>

        <div className="market-filter-card">

          <div className="market-filter-group">
            <label>
              Select Crop
            </label>

            <select
              value={crop}
              onChange={(e) =>
                setCrop(e.target.value)
              }
            >
              {crops.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item.charAt(0).toUpperCase() +
                    item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="market-filter-group">
            <label>
              Your Farm Location
            </label>

            <select
              value={origin}
              onChange={(e) =>
                setOrigin(e.target.value)
              }
            >
              {locations.map((location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>
          </div>

        </div>

        {loading && (
          <div className="market-status-card">
            Loading market intelligence...
          </div>
        )}

        {message && !loading && (
          <div className="market-status-card">
            {message}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="market-overview-grid">

              <div className="market-overview-card">
                <span>
                  Average Market Price
                </span>

                <strong>
                  ₹
                  {data.average_price_per_kg}
                  /KG
                </strong>
              </div>

              <div className="market-overview-card">
                <span>
                  Recommended Market
                </span>

                <strong>
                  {
                    rankedMarkets[0]
                      ?.market_location
                  }
                </strong>
              </div>

              <div className="market-overview-card">
                <span>
                  Demand
                </span>

                <strong>
                  {
                    rankedMarkets[0]
                      ?.demand_level
                  }
                </strong>
              </div>

              <div className="market-overview-card">
                <span>
                  Price Trend
                </span>

                <strong>
                  {Number(
                    rankedMarkets[0]
                      ?.trend_percent
                  ) >= 0
                    ? "↑ "
                    : "↓ "}

                  {Math.abs(
                    Number(
                      rankedMarkets[0]
                        ?.trend_percent
                    )
                  )}
                  %
                </strong>
              </div>

            </div>

            {rankedMarkets[0] && (
              <div className="market-recommendation">

                <div>
                  <p className="section-label">
                    SMART RECOMMENDATION
                  </p>

                  <h2>
                    Sell at{" "}
                    {
                      rankedMarkets[0]
                        .market_name
                    }
                  </h2>

                  <p>
                    Best combined opportunity
                    considering market price,
                    demand and approximate
                    transport from{" "}
                    <strong>{origin}</strong>.
                  </p>
                </div>

                <div className="market-recommendation-badge">
                  {
                    rankedMarkets[0]
                      .market_location
                  }
                </div>

              </div>
            )}

            <div className="market-section-title">

              <p className="section-label">
                MARKET COMPARISON
              </p>

              <h2>
                Available Markets
              </h2>

            </div>

            <div className="market-grid">

              {data.markets.map((market) => {

                const distance =
                  getDistance(
                    market.market_location
                  );

                const transport =
                  getTransportCost(
                    market.market_location
                  );

                const netValue =
                  getNetValue(market);

                const recommended =
                  rankedMarkets[0]?.id ===
                  market.id;

                return (
                  <div
                    className={`market-card ${
                      recommended
                        ? "market-card-recommended"
                        : ""
                    }`}
                    key={market.id}
                  >

                    {recommended && (
                      <span className="recommended-label">
                        RECOMMENDED
                      </span>
                    )}

                    <div className="market-card-top">

                      <div>
                        <h3>
                          {market.market_name}
                        </h3>

                        <span>
                          {market.market_location}
                        </span>
                      </div>

                      <span
                        className={`demand-badge demand-${market.demand_level.toLowerCase()}`}
                      >
                        {market.demand_level}
                      </span>

                    </div>

                    <div className="market-price-main">
                      ₹
                      {Number(
                        market.price_per_kg
                      ).toFixed(2)}

                      <span>
                        /KG
                      </span>
                    </div>

                    <div className="market-price-range">
                      Range ₹
                      {market.min_price_per_kg}
                      {" – "}
                      ₹
                      {market.max_price_per_kg}
                      /KG
                    </div>

                    <div className="market-stat-grid">

                      <div>
                        <span>
                          Demand Score
                        </span>

                        <strong>
                          {market.demand_score}
                          /100
                        </strong>
                      </div>

                      <div>
                        <span>
                          Trend
                        </span>

                        <strong>
                          {Number(
                            market.trend_percent
                          ) >= 0
                            ? "↑ "
                            : "↓ "}

                          {Math.abs(
                            Number(
                              market.trend_percent
                            )
                          )}
                          %
                        </strong>
                      </div>

                      <div>
                        <span>
                          Distance
                        </span>

                        <strong>
                          {distance} km
                        </strong>
                      </div>

                      <div>
                        <span>
                          Est. Transport
                        </span>

                        <strong>
                          ₹
                          {transport.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="market-profit-box">

                      <span>
                        Example net value for 100 KG
                      </span>

                      <strong>
                        ₹
                        {netValue.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                  </div>
                );
              })}

            </div>

            <div className="market-note">

              <strong>
                Decision support:
              </strong>

              <span>
                The recommendation considers
                indicative market price, demand and
                approximate transport cost. This
                prototype can later consume live
                mandi feeds.
              </span>

            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default MarketIntelligence;