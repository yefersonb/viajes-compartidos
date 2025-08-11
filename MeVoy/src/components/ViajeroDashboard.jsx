//src/components/ViajeroDashboard.jsx
import React from "react";
import PerfilViajeroPage from "./PerfilViajeroPage";
import BuscadorViajes from "./BuscadorViajes";
import PagoButton from "./PagoButton";

export default function ViajeroDashboard({
  usuario,
  viajes,
  perfilCompleto,
  viajeReservado,
  onReservar,
}) {
  return (
    <div>
      <PerfilViajeroPage perfilCompleto={perfilCompleto} />

      <div style={{ marginTop: 32 }}>
        <h3>Buscar viajes</h3>

        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <BuscadorViajes
            viajes={viajes}
            usuario={usuario}
            onReservar={onReservar}
          />
        </div>

        {viajeReservado && (
          <div style={{ marginTop: 16 }}>
            <PagoButton viaje={viajeReservado} usuario={usuario} />
          </div>
        )}
      </div>
    </div>
  );
}
