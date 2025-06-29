// BuscadorViajes.js
import React, { useEffect, useState } from "react";

export default function BuscadorViajes({ viajes = [], onBuscar }) {
  const [input, setInput] = useState("Montecarlo");

  useEffect(() => {
    if (onBuscar) onBuscar("Montecarlo");
  }, [onBuscar]);

  const manejarCambio = (e) => {
    const valor = e.target.value;
    setInput(valor);
    if (onBuscar) onBuscar(valor);
  };

  return (
    <div className="buscador-viajes" style={{ marginBottom: "1.5rem" }}>
      <input
        type="text"
        placeholder="Buscar por origen o destino..."
        value={input}
        onChange={manejarCambio}
        style={{
          padding: "8px",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "0.5rem",
        }}
      />
      <p>{viajes.length} viajes cargados</p>
    </div>
  );
}
