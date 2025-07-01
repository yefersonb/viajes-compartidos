// src/components/ConductorDashboard.js
import React from "react";

export default function ConductorDashboard({ usuario }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Modo Conductor</h2>
      <p>Bienvenido, {usuario?.displayName || usuario?.email}.</p>
      <p>Aquí podrás crear nuevos viajes y gestionar tus reservas.</p>
      {/* TODO: Implementar formularios y lista de reservas */}
    </div>
  );
}
