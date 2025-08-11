// src/components/BuscadorViajes.js
import React, { useState, useEffect } from "react";
import DetalleViaje from "./DetalleViaje";
import AutocompleteInput from "./AutocompleteInput";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Props:
 * - viajes?: { id, origen, destino, fecha (ISO), asientos, horario, aceptaPaquetes?, pesoMax?, volumenMax?, costoBasePaquete? }[]
 * - usuario
 * - onReservar
 */
export default function BuscadorViajes({ viajes = [], usuario, onReservar }) {
  // ---------- estilos ----------
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

  // ---------- buscador viajes ----------
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [momento, setMomento] = useState("");

  // filtros de paquetes
  const [soloPaquetes, setSoloPaquetes] = useState(false);
  const [pesoReq, setPesoReq] = useState("");
  const [volumenReq, setVolumenReq] = useState("");

  const [resultados, setResultados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // precargar resultados iniciales
    setResultados(viajes);
  }, [viajes]);

  // ---------- filtro de viajes ----------
  const filtrarCliente = (lista) => {
    const dateISO = fecha || null;
    const origText = typeof origen === "object" ? origen.formatted_address : origen;
    const destText = typeof destino === "object" ? destino.formatted_address : destino;

    const reqPeso = pesoReq !== "" ? Number(pesoReq) : null;
    const reqVol = volumenReq !== "" ? Number(volumenReq) : null;

    return (lista || []).filter((v) => {
      const matchOrigen = origText ? v.origen?.toLowerCase?.().includes(origText.toLowerCase()) : true;
      const matchDestino = destText ? v.destino?.toLowerCase?.().includes(destText.toLowerCase()) : true;
      const matchFecha = dateISO ? String(v.fecha).slice(0, 10) === dateISO : true;
      const matchAsientos = (v.asientos ?? 0) >= pasajeros;

      let matchMomento = true;
      if (momento && v.horario) {
        const hour = parseInt(String(v.horario).slice(11, 13), 10);
        if (momento === "manana") matchMomento = hour >= 6 && hour < 12;
        else if (momento === "tarde") matchMomento = hour >= 12 && hour < 18;
        else if (momento === "noche") matchMomento = hour >= 18 || hour < 6;
      }

      const matchSoloPaquetes = !soloPaquetes ? true : !!v.aceptaPaquetes;

      let matchPesoVol = true;
      if (reqPeso != null || reqVol != null) {
        if (!v.aceptaPaquetes) {
          matchPesoVol = false;
        } else {
          const pMax = typeof v.pesoMax === "number" ? v.pesoMax : Number(v.pesoMax);
          const vMax = typeof v.volumenMax === "number" ? v.volumenMax : Number(v.volumenMax);
          if (reqPeso != null && !(pMax >= reqPeso)) matchPesoVol = false;
          if (reqVol != null && !(vMax >= reqVol)) matchPesoVol = false;
        }
      }

      return (
        matchOrigen &&
        matchDestino &&
        matchFecha &&
        matchAsientos &&
        matchMomento &&
        matchSoloPaquetes &&
        matchPesoVol
      );
    });
  };

  const buscar = async () => {
    setLoading(true);
    try {
      setResultados(filtrarCliente(viajes));
    } finally {
      setLoading(false);
    }
  };

  const confirmarReserva = async (viajeId) => {
    if (!usuario) {
      alert("Iniciá sesión para reservar");
      return;
    }
    if (viajeId == null) {
      alert("Error interno: viaje desconocido.");
      return;
    }
    setLoading(true);
    try {
      const reservasCol = collection(db, "viajes", viajeId, "reservas");
      await addDoc(reservasCol, {
        viajanteUid: usuario.uid,
        fechaReserva: serverTimestamp(),
        cantidadPasajeros: 1,
        estadoReserva: "pendiente",
        creadoPor: usuario.uid,
      });
      if (typeof onReservar === "function") await onReservar(viajeId);
      alert("¡Reserva creada! Esperando aprobación del conductor.");
      setDetalle(null);
      buscar();
    } catch (err) {
      console.error("Error creando reserva:", err);
      alert("Hubo un problema al reservar.");
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
        Buscar viajes
      </h3>

      {/* ----- BUSCADOR DE VIAJES ----- */}
      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="origen" style={labelStyle}>Origen</label>
        <AutocompleteInput
          id="origen"
          placeholder="Ingresa origen"
          value={typeof origen === "object" ? origen.formatted_address : origen}
          onChange={setOrigen}
        />
      </div>
      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="destino" style={labelStyle}>Destino</label>
        <AutocompleteInput
          id="destino"
          placeholder="Ingresa destino"
          value={typeof destino === "object" ? destino.formatted_address : destino}
          onChange={setDestino}
        />
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="fecha" style={labelStyle}>Fecha</label>
        <input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="momento" style={labelStyle}>Momento del día</label>
        <select id="momento" value={momento} onChange={(e) => setMomento(e.target.value)} style={inputStyle}>
          <option value="">Cualquiera</option>
          <option value="manana">Mañana (06–12)</option>
          <option value="tarde">Tarde (12–18)</option>
          <option value="noche">Noche (18–06)</option>
        </select>
      </div>
      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="pasajeros" style={labelStyle}>Pasajeros</label>
        <select id="pasajeros" value={pasajeros} onChange={(e) => setPasajeros(Number(e.target.value))} style={inputStyle}>
          {[...Array(6)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} pasajero{i > 0 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Paquetes: solo muestra campos extra cuando está activo */}
      <div style={{ margin: "1rem 0", padding: "12px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={soloPaquetes} onChange={(e) => setSoloPaquetes(e.target.checked)} />
          <span style={{ fontWeight: 600 }}>Solo viajes que aceptan paquetes</span>
        </label>

        {soloPaquetes && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Peso a enviar (kg) — opcional</label>
              <input
                type="number" min={0} step="0.1" value={pesoReq}
                onChange={(e) => setPesoReq(e.target.value)}
                placeholder="Ej: 3" style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Volumen (L) — opcional</label>
              <input
                type="number" min={0} step="0.1" value={volumenReq}
                onChange={(e) => setVolumenReq(e.target.value)}
                placeholder="Ej: 15" style={inputStyle}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={buscar}
        disabled={loading}
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          padding: "0.75rem",
          border: "none",
          borderRadius: "0.375rem",
          fontFamily: "inherit",
          width: "100%",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "1rem",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Buscando…" : "Buscar"}
      </button>

      <div style={{ marginTop: "1.5rem" }}>
        {resultados.length === 0 ? (
          <p style={{ color: "#4b5563" }}>
            {loading ? "Cargando resultados…" : `No hay viajes disponibles${soloPaquetes ? " que acepten paquetes" : ""}.`}
          </p>
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

              {v.aceptaPaquetes && (
                <div style={{
                  marginTop: 8, fontSize: 12, display: "inline-flex", gap: 8, alignItems: "center",
                  background: "#eef2ff", color: "#3730a3", padding: "6px 10px", borderRadius: 999
                }}>
                  <span>📦 Acepta paquetes</span>
                  <span>• Peso máx: <strong>{v.pesoMax ?? "—"}</strong> kg</span>
                  <span>• Volumen máx: <strong>{v.volumenMax ?? "—"}</strong> L</span>
                  {v.costoBasePaquete != null && (
                    <span>• Desde <strong>${Number(v.costoBasePaquete).toLocaleString("es-AR")}</strong></span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
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
                  disabled={loading}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: loading ? "#a5d1c2" : "#10b981",
                    color: "white",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
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
