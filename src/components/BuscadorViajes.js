import React, { useState } from "react";

export default function BuscadorViajes({ viajes = [], onBuscar }) {
  const [input, setInput] = useState("");

  const manejarCambio = (e) => {
    const valor = e.target.value;
    setInput(valor);
    if (onBuscar) onBuscar(valor);
  };

  return (
    <div className="buscador-viajes">
      <input
        type="text"
        placeholder="Buscar por origen o destino..."
        value={input}
        onChange={manejarCambio}
        style={{
          padding: "8px",
          width: "100%",
          maxWidth: "400px",
          marginBottom: "1rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />
      <p>{viajes.length} viajes cargados</p>
    </div>
  );
}
