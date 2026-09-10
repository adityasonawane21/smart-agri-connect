import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Features from "./components/Features";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CreateListing from "./components/CreateListing";
import Marketplace from "./components/Marketplace";
import BuyerDemand from "./components/BuyerDemand";
import FarmerDemands from "./components/FarmerDemands";
import BuyerOffers from "./components/BuyerOffers";
import SmartLogistics from "./components/SmartLogistics";
import MarketIntelligence from "./components/MarketIntelligence";
import Orders from "./components/Orders";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <footer className="site-footer">
        <div>
          <strong>Smart Agri Connect</strong>
          <span>Farmer-first market linkage and shared logistics.</span>
        </div>
        <span>SIH 2026 • PS 26033</span>
      </footer>
    </>
  );
}

function Page({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Page><Register /></Page>} />
        <Route path="/login" element={<Page><Login /></Page>} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/create-listing" element={<Page><CreateListing /></Page>} />
        <Route path="/marketplace" element={<Page><Marketplace /></Page>} />
        <Route path="/buyer-demand" element={<Page><BuyerDemand /></Page>} />
        <Route path="/buyer-offers" element={<Page><BuyerOffers /></Page>} />
        <Route path="/farmer-demands" element={<Page><FarmerDemands /></Page>} />
        <Route path="/orders" element={<Page><Orders /></Page>} />
        <Route path="/logistics" element={<Page><SmartLogistics /></Page>} />
        <Route path="/market-intelligence" element={<Page><MarketIntelligence /></Page>} />
      </Routes>
    </HashRouter>
  );
}

export default App;

