import React from "react";
import { Link } from "react-router-dom";

const Navigation = () => (
  <nav>
    <ul>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/features">Features</Link></li>
      <li><Link to="/pricing">Pricing</Link></li>
      <li><Link to="/enterprise">Enterprise</Link></li>
      <li><Link to="/support">Support</Link></li>
      <li><Link to="/faq">FAQ</Link></li>
      <li><Link to="/checkout">Checkout</Link></li>
      <li><Link to="/founder-override">Founder Override</Link></li>
      <li><Link to="/terms">Terms</Link></li>
      <li><Link to="/privacy">Privacy</Link></li>
      <li><Link to="/press-kit">Press Kit</Link></li>
      <li><Link to="/launch-trailer">Launch Trailer</Link></li>
    </ul>
  </nav>
);

export default Navigation;
