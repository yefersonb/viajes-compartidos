import React, { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import AutocompleteInput from "./AutocompleteInput"; // 👈 Importá el input con Google Places

export default function NuevoViaje() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [asientos, setAsientos] = useState(1);
  const [loading, setLoading] = useState(false);

  const publicarViaje = async () => {
    if (!auth.currentUser) return alert("⚠️ Iniciá sesión para publicar.");

    setLoading(true);

    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
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

      await addDoc(collection(db, "viajes"), {
        origen,
        destino,
        fecha,
        asientos,
        creado: new Date(),
        conductor: {
          uid: auth.currentUser.uid,
          nombre: userData.nombre,
          whatsapp: userData.whatsapp,
        },
      });

      alert("✅ Viaje publicado!");
      setOrigen("");
      setDestino("");
      setFecha("");
      setAsientos(1);
    } catch (error) {
      console.error("❌ Error al publicar viaje:", error);
      alert("Error al publicar viaje.");
    }

    setLoading(false);
  };

  const formularioIncompleto = !origen || !destino || !fecha || asientos < 1;

  return (
    <div>
      <h3>Crear Nuevo Viaje</h3>
      <AutocompleteInput placeholder="Origen" value={origen} onChange={setOrigen} />
      <AutocompleteInput placeholder="Destino" value={destino} onChange={setDestino} />
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="border p-2 m-2 w-full"
      />
      <input
        type="number"
        min={1}
        value={asientos}
        onChange={(e) => setAsientos(parseInt(e.target.value))}
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
