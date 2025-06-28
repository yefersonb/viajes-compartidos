import React, { useState } from "react";
import AutocompleteInput from "./AutocompleteInput";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function BuscadorViajes() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarViajes = async () => {
    if (!origen || !destino || !fechaHora) {
      alert("Por favor completá todos los campos.");
      return;
    }
    setLoading(true);

    try {
      // Trae todos los viajes y filtra manualmente por origen, destino y fecha/hora
      const snapshot = await getDocs(collection(db, "viajes"));
      const viajesFiltrados = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v =>
          v.origen === origen &&
          v.destino === destino &&
          v.horario >= fechaHora // solo viajes igual o después de la fecha/hora buscada
        );
      setViajes(viajesFiltrados);
    } catch (error) {
      alert("Error buscando viajes");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "500px", margin: "auto" }}>
      <h2>Buscar Viajes</h2>
      <AutocompleteInput
        placeholder="Origen"
        value={origen}
        onChange={setOrigen}
      />
      <AutocompleteInput
        placeholder="Destino"
        value={destino}
        onChange={setDestino}
      />
      <input
        type="datetime-local"
        value={fechaHora}
        onChange={e => setFechaHora(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />
      <button
        onClick={buscarViajes}
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

      <hr />

      {loading && <p>Buscando viajes...</p>}
      {viajes.length === 0 && !loading && <p>No hay viajes que coincidan.</p>}
      <ul className="viajes-list">
        {viajes.map((v) => (
          <li key={v.id}>
            <strong>
              {v.origen} → {v.destino}
            </strong>
            <br />
            Horario: {new Date(v.horario).toLocaleString()}
            <br />
            Asientos disponibles: {v.asientos}
            <br />
            Contacto:{" "}
            <a
              href={`https://wa.me/${v.conductor.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {v.conductor.nombre}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}