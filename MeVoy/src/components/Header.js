import React from "react";
import logo from "../assets/logo/logo_light.png"; // Optimization here is a pain!
import pfp from "../assets/ui/profile_picture_placeholder.png"; // Optimization here is a pain!

export default function Header() {
  return (
    <header className="header shaded"> {/* The shaded class can be toggled to add flair to the UI (More on that later) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", height: "90%" }}>
        <img src={logo} alt="MeVoy Logo" style={{ height: "90%", opacity: "0.7" }} />
        <div>Viajes Compartidos</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", height: "90%" }}>
        <div>Hola, <i>Nombre</i></div>
        {/* Profile picture should go here — placeholder*/}
        <img src={pfp} alt="Foto de Perfil" style={{ height: "100%", borderRadius: "50%", overflow: "hidden", opacity: "0.2" }} />
      </div>
    </header>
  );
}
