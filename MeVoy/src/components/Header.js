import React from "react";
import logo from "../assets/logo/logo_light.png"; // Optimization here is a pain!

export default function Header() {
  return (
    <header className="header">
      <img src={logo} alt="MeVoy Logo" style={{ height: "100%" }} />
      Viajes Compartidos
      
      {/* Profile picture should go here — placeholder*/}
      <div style={{ height: "2rem", width: "2rem", backgroundColor: "gray", borderRadius: "50%" }}></div>

    </header>
  );
}
