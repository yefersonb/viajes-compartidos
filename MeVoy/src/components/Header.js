import React from "react";
import logo from "../assets/logo/logo_light.png";
import pfp from "../assets/ui/profile_picture_placeholder.png";
import { useUser } from "../contexts/UserContext";

export default function Header() {
  const { usuario } = useUser() || {};

  const nombre =
    usuario?.displayName ||
    usuario?.nombre ||
    usuario?.perfil?.nombre ||
    (usuario?.email ? usuario.email.split("@")[0] : "Invitado");

  const foto = usuario?.photoURL || pfp;

  return (
    <header className="header shaded">
      <img src={logo} alt="MeVoy Logo" style={{ height: "100%", opacity: "0.7" }} />

      <div className="button borderless row neutral" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "calc(100% - 2rem)", gap: "0.8rem", height: "100%", padding: "0" }}>
        {/* this id and span can be used to hide the "Hola, " and "!" text via JS — This could be better implemented via CSS-Only tricks! */}
        <div className=""><span id="header-hola" className="">Hola, </span>{nombre}<span id="header-hola-exclamation" className="">!</span></div>
        <img
          src={foto}
          alt="Foto de Perfil"
          style={{
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            opacity: usuario?.photoURL ? 1 : 0.2
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", height: "100%" }}>
        <div className="button borderless row neutral">
          <div className="arrow animated pointing-right"></div>
          <div>Viajante</div>
        </div>
      </div>
    </header>
  );
}
