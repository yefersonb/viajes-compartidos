// MeVoy/src/components/Header.js
import React from "react";
import logo from "../assets/logo/logo_light.png";
import pfp from "../assets/ui/profile_picture_placeholder.png";
import { useUser } from "../contexts/UserContext";

export default function Header({ rol = "viajero", onToggleRol, onLogout }) {
  const { usuario } = useUser() || {};

  const nombre =
    usuario?.displayName ||
    usuario?.nombre ||
    usuario?.perfil?.nombre ||
    (usuario?.email ? usuario.email.split("@")[0] : "Invitado");

  const foto = usuario?.photoURL || pfp;

  const etiquetaRol = rol === "viajero" ? "Viajante" : "Conductor";
  const proximoRol = rol === "viajero" ? "conductor" : "viajero";

  return (
    <header className="header shaded">
      <img
        src={logo}
        alt="MeVoy Logo"
        style={{ height: "100%", opacity: 0.7 }}
      />

      <div
        className="button borderless row neutral"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "calc(100% - 2rem)",
          gap: "0.8rem",
          height: "100%",
          padding: 0,
        }}
      >
        <div>
          <span id="header-hola">Hola, </span>
          {nombre}
          <span id="header-hola-exclamation">!</span>
        </div>

      <div style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", width: "calc(100% - 2rem)", gap: "0.8rem", height: "100%", padding: "0" }}>
        {/* this id and span can be used to hide the "Hola, " and "!" text via JS — This could be better implemented via CSS-Only tricks! */}
        <div className=""><span id="header-hola" className="">Hola, </span>{nombre}<span id="header-hola-exclamation" className="">!</span></div>
        <img
          src={foto}
          alt="Foto de perfil"
          style={{
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            opacity: usuario?.photoURL ? 1 : 0.2,
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", height: "100%", gap: "0.5rem" }}>
        <button
          type="button"
          className="button borderless row neutral"
          onClick={onToggleRol}
          title={`Cambiar a ${proximoRol}`}
          style={{ cursor: "pointer" }}
        >
          <div className="arrow animated pointing-right"></div>
          <div>{etiquetaRol}</div>
        </button>

        {onLogout && (
          <button
            type="button"
            className="button borderless row danger"
            onClick={onLogout}
            title="Cerrar sesión"
            style={{ cursor: "pointer" }}
          >
            Salir
          </button>
        )}
      </div>
    </header>
  );
}
