// src/components/BuscadorViajes.js
import React, { useState } from "react";
import DetalleViaje from "./DetalleViaje";
import AutocompleteInput from "./AutocompleteInput";
import { useUser } from "../contexts/UserContext";
import { usePerfilViajeroCompleto } from "../hooks/usePerfilViajeroCompleto";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Componente BuscadorViajes
 * Props:
 * - viajes: Array de objetos { id, origen, destino, fecha (ISO), asientos, origenCoords, destinoCoords, horario }
 * - usuario: Objeto usuario con al menos uid, o null si no hay sesión
 * - onReservar: Función (viajeId) => Promise<void> que ejecuta lógica adicional después de crear la reserva
 */
export default function BuscadorViajes({ viajes, usuario, onReservar }) {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [momento, setMomento] = useState("");
  const [resultados, setResultados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  const { perfil, cargando: cargandoPerfil, puedeReservar } = usePerfilViajeroCompleto(usuario?.uid);

  // Estilos compartidos
  const inputStyle = {
    width: "100%",
    padding: "0.5rem",
    margin: "0.5rem 0",
    border: "1px solid #ccc",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSize: "1rem",
  };
  const labelStyle = {
    display: "block",
    fontSize: "0.875rem",
    marginBottom: "0.25rem",
    fontWeight: 500,
  };

  // Filtrar viajes según criterios
  const buscar = () => {
    const dateISO = fecha ? fecha : null;
    const origText = typeof origen === "object" ? origen.formatted_address : origen;
    const destText = typeof destino === "object" ? destino.formatted_address : destino;
    const filt = viajes.filter((v) => {
      const matchOrigen = origText
        ? v.origen.toLowerCase().includes(origText.toLowerCase())
        : true;
      const matchDestino = destText
        ? v.destino.toLowerCase().includes(destText.toLowerCase())
        : true;
      const matchFecha = dateISO ? v.fecha.slice(0, 10) === dateISO : true;
      const matchAsientos = v.asientos >= pasajeros;
      let matchMomento = true;
      if (momento) {
        const hour = parseInt(v.horario.slice(11, 13), 10);
        if (momento === "manana") matchMomento = hour >= 6 && hour < 12;
        else if (momento === "tarde") matchMomento = hour >= 12 && hour < 18;
        else if (momento === "noche") matchMomento = hour >= 18 || hour < 6;
      }
      return matchOrigen && matchDestino && matchFecha && matchAsientos && matchMomento;
    });
    setResultados(filt);
  };

  // Confirmar reserva y guardarla en Firestore
  const confirmarReserva = async (viajeId) => {
    if (!usuario) {
      alert("Iniciá sesión para reservar");
      return;
    }
    if (cargandoPerfil) {
      alert("Esperá a que se cargue tu perfil");
      return;
    }
    if (!puedeReservar) {
      alert("Tenés que completar tu perfil antes de reservar. Nombre, WhatsApp y dirección son obligatorios.");
      window.location.href = "/perfil-viajero";
      return;
    }
    if (typeof viajeId === "undefined" || viajeId === null) {
      console.error("Falta el viajeId para reservar");
      alert("Error interno: no se pudo identificar el viaje.");
      return;
    }

    setLoading(true);
    try {
      // Crear la reserva en Firestore dentro de /viajes/{viajeId}/reservas
      const reservasCol = collection(db, "viajes", viajeId, "reservas");
      await addDoc(reservasCol, {
        viajanteUid: usuario.uid,
        fechaReserva: serverTimestamp(),
        cantidadPasajeros: 1,
        estadoReserva: "pendiente",
        creadoPor: usuario.uid,
      });

      // Lógica adicional si te pasaron callback
      if (typeof onReservar === "function") {
        await onReservar(viajeId);
      }

      alert("¡Reserva creada! Esperando aprobación del conductor.");
      setDetalle(null);
      buscar(); // refresca resultados en caso de cambios en asientos
    } catch (err) {
      console.error("Error creando reserva:", err);
      if (err.code === "permission-denied") {
        alert("No tenés permiso para reservar. Revisá las reglas de Firestore.");
      } else {
        alert("Hubo un problema al reservar.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (detalle) {
    return (
      <DetalleViaje
        viaje={detalle}
        pasajeros={pasajeros}
        onClose={() => setDetalle(null)}
        onReservar={() => confirmarReserva(detalle.id)}
        loading={loading}
      />
    );
  }

  return (
    <section style={{ padding: "1rem" }}>
      <h3
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          textAlign: "center",
        }}
      >
        Buscar Viajes
      </h3>

      {!puedeReservar && !cargandoPerfil && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <p style={{ margin: 0 }}>
            Antes de reservar tenés que completar tu perfil: nombre, WhatsApp y dirección.{" "}
            <a href="/perfil-viajero" className="underline font-semibold">
              Completar perfil
            </a>
          </p>
        </div>
      )}

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="origen" style={labelStyle}>
          Origen
        </label>
        <AutocompleteInput
          id="origen"
          placeholder="Ingresa origen"
          value={typeof origen === "object" ? origen.formatted_address : origen}
          onChange={setOrigen}
          style={inputStyle}
        />
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="destino" style={labelStyle}>
          Destino
        </label>
        <AutocompleteInput
          id="destino"
          placeholder="Ingresa destino"
          value={typeof destino === "object" ? destino.formatted_address : destino}
          onChange={setDestino}
          style={inputStyle}
        />
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="fecha" style={labelStyle}>
          Fecha
        </label>
        <input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="momento" style={labelStyle}>
          Momento del día
        </label>
        <select id="momento" value={momento} onChange={(e) => setMomento(e.target.value)} style={inputStyle}>
          <option value="">Cualquiera</option>
          <option value="manana">Mañana (06–12)</option>
          <option value="tarde">Tarde (12–18)</option>
          <option value="noche">Noche (18–06)</option>
        </select>
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="pasajeros" style={labelStyle}>
          Pasajeros
        </label>
        <select id="pasajeros" value={pasajeros} onChange={(e) => setPasajeros(Number(e.target.value))} style={inputStyle}>
          {[...Array(6)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} pasajero{ i > 0 && "s" }
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={buscar}
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          padding: "0.75rem",
          border: "none",
          borderRadius: "0.375rem",
          fontFamily: "inherit",
          width: "100%",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        Buscar
      </button>

      <div style={{ marginTop: "1.5rem" }}>
        {resultados.length === 0 ? (
          <p style={{ color: "#4b5563" }}>No hay viajes disponibles.</p>
        ) : (
          resultados.map((v) => (
            <div
              key={v.id}
              style={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontWeight: 500 }}>
                {v.origen} → {v.destino}
              </p>
              <p style={{ fontSize: "0.875rem" }}>{new Date(v.fecha).toLocaleString()}</p>
              <p style={{ fontSize: "0.875rem" }}>Asientos: {v.asientos}</p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => setDetalle(v)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Ver detalles
                </button>
                <button
                  onClick={() => confirmarReserva(v.id)}
                  disabled={!puedeReservar || cargandoPerfil}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: !puedeReservar || cargandoPerfil ? "#a5d1c2" : "#10b981",
                    color: "white",
                    border: "none",
                    cursor: !puedeReservar || cargandoPerfil ? "not-allowed" : "pointer",
                  }}
                >
                  Reservar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
