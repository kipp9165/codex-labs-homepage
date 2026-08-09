import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import FAQ from "./pages/FAQ";
import Enterprise from "./pages/Enterprise";
import FounderOverride from "./pages/FounderOverride";
import Checkout from "./pages/Checkout";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PressKit from "./pages/PressKit";
import LaunchTrailer from "./pages/LaunchTrailer";
import Navigation from "./components/Navigation";

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/founder-override" element={<FounderOverride />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/press-kit" element={<PressKit />} />
        <Route path="/launch-trailer" element={<LaunchTrailer />} />
      </Routes>
    </Router>
  );
}

export default App;
