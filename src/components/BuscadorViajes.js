import React, { useState, useRef } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];

function BuscadorViajes({ onBuscar }) {
  const [fecha, setFecha] = useState("");
  const origenRef = useRef(null);
  const destinoRef = useRef(null);

  const handleBuscar = () => {
    const origen = origenRef.current.getPlace()?.formatted_address;
    const destino = destinoRef.current.getPlace()?.formatted_address;

    if (origen && destino && fecha) {
      onBuscar({ origen, destino, fecha });
    } else {
      alert("Por favor completá todos los campos.");
    }
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyCWrPZ9Y5tq-IOH3gO8HMUxIeqEKj24T2M"
      libraries={libraries}
    >
      <div style={{ padding: "1rem", maxWidth: "400px" }}>
        <Autocomplete onLoad={(ref) => (origenRef.current = ref)}>
          <input
            type="text"
            placeholder="Origen"
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
        </Autocomplete>

        <Autocomplete onLoad={(ref) => (destinoRef.current = ref)}>
          <input
            type="text"
            placeholder="Destino"
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
        </Autocomplete>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <button
          onClick={handleBuscar}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Buscar viaje
        </button>
      </div>
    </LoadScript>
  );
}

export default BuscadorViajes;
