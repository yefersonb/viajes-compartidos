import React, { useState } from "react";
import DetalleViaje from "./DetalleViaje";

export default function BuscadorViajes({ viajes }) {
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);

  const handleReservar = (idViaje) => {
    // 🔧  tu lógica de reserva (Firestore, etc.)
    console.log("Reservado", idViaje);
    setViajeSeleccionado(null);
  };

  if (viajeSeleccionado) {
    return (
      <DetalleViaje
        viaje={viajeSeleccionado}
        onClose={() => setViajeSeleccionado(null)}
        onReservar={handleReservar}
      />
    );
  }

  return (
    <div>
      <h2>Buscar Viajes</h2>
      {viajes.map((viaje) => (
        <div key={viaje.id} style={{ marginBottom: 10 }}>
          <p>
            {viaje.origen} → {viaje.destino} ({viaje.fecha})
          </p>
          <button onClick={() => setViajeSeleccionado(viaje)}>
            Ver detalles
          </button>
        </div>
      ))}
    </div>
  );
}
