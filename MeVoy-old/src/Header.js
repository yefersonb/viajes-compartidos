import React from "react";
import logo from "./assets/logomevoy.png"; // Asegurate que el archivo esté en src/assets

export default function Header() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}>
      <h1 style={{ margin: 0, fontSize: "2.0rem", fontFamily: "'Roboto', sans-serif" }}>Viajes Compartidos</h1>
      <img src={logo} alt="MeVoy Logo" style={{ height: "150px" }} />
    </header>
  );
}

