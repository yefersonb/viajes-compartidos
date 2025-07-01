// src/components/NuevoViaje.js
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import AutocompleteInput from "./AutocompleteInput";

export default function NuevoViaje() {
  const [origen,   setOrigen]   = useState("");
  const [destino,  setDestino]  = useState("");
  const [fechaHora, setFechaHora] = useState(""); // input type="datetime-local"
  const [asientos, setAsientos] = useState(1);
  const [loading,  setLoading]  = useState(false);

  // ------------------  Publicar ------------------
  const publicarViaje = async () => {
    if (!auth.currentUser) return alert("⚠️ Iniciá sesión para publicar.");
    if (!origen || !destino || !fechaHora) {
      return alert("Completá todos los campos.");
    }

    setLoading(true);
    try {
      // ────── Datos del usuario ──────
      const userRef  = doc(db, "usuarios", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert("⚠️ Usuario no registrado en Firestore.");
        setLoading(false);
        return;
      }
      const userData = userSnap.data();
      if (!userData.nombre || !userData.whatsapp) {
        alert("⚠️ Faltan datos del usuario (nombre o WhatsApp).");
        setLoading(false);
        return;
      }

      // ────── Dirección legible y coordenadas ──────
      const origenStr  = origen?.formatted_address  ?? origen;
      const destinoStr = destino?.formatted_address ?? destino;

      const origenCoords = origen?.geometry?.location
        ? {
            lat: origen.geometry.location.lat(),
            lng: origen.geometry.location.lng(),
          }
        : null;

      const destinoCoords = destino?.geometry?.location
        ? {
            lat: destino.geometry.location.lat(),
            lng: destino.geometry.location.lng(),
          }
        : null;

      // Separar fecha y hora para filtros simples
      const [fecha] = fechaHora.split("T"); // "YYYY-MM-DD"

      // ────── Registrar en Firestore ──────
      await addDoc(collection(db, "viajes"), {
        origen: origenStr,
        destino: destinoStr,
        origenCoords,
        destinoCoords,
        fecha,                // para consultas por día
        horario: fechaHora,   // fecha + hora completa
        asientos,
        creado: new Date(),
        conductor: {
          uid: auth.currentUser.uid,
          nombre: userData.nombre,
          whatsapp: userData.whatsapp,
        },
      });

      alert("✅ Viaje publicado!");

      // Resetear formulario
      setOrigen("");
      setDestino("");
      setFechaHora("");
      setAsientos(1);
    } catch (error) {
      console.error("❌ Error al publicar viaje:", error);
      alert("Error al publicar viaje.");
    }
    setLoading(false);
  };

  const formularioIncompleto =
    !origen || !destino || !fechaHora || asientos < 1;

  // ------------------  UI ------------------
  return (
    <div style={{ padding: 16 }}>
      <h3>Crear Nuevo Viaje</h3>

      <AutocompleteInput
        placeholder="Origen"
        value={origen?.formatted_address ?? origen}
        onChange={setOrigen}
      />

      <AutocompleteInput
        placeholder="Destino"
        value={destino?.formatted_address ?? destino}
        onChange={setDestino}
      />

      <input
        type="datetime-local"
        value={fechaHora}
        onChange={(e) => setFechaHora(e.target.value)}
        className="border p-2 m-2 w-full"
      />

      <input
        type="number"
        min={1}
        value={asientos}
        onChange={(e) => setAsientos(parseInt(e.target.value, 10))}
        className="border p-2 m-2 w-full"
      />

      <button
        onClick={publicarViaje}
        disabled={formularioIncompleto || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Publicando..." : "Publicar Viaje"}
      </button>
    </div>
  );
}
