// src/components/PerfilViajero.js
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PerfilViajero() {
  const { usuario } = useUser();
  const defaultPrefs = { mascotas: false, musica: true, fumar: false, aire: true };

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [direccion, setDireccion] = useState("");
  const [preferencias, setPreferencias] = useState(defaultPrefs);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const cargarPerfil = async () => {
      try {
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNombre(data.nombre || usuario.displayName || "");
          setWhatsapp(data.whatsapp || "");
          setDireccion(data.direccion || "");
          setPreferencias(prev => data.preferencias ?? prev);
        }
      } catch (error) {
        console.error("Error cargando perfil de viajero:", error);
      }
    };
    cargarPerfil();
  }, [usuario]);

  const guardarPerfil = async () => {
    if (!nombre || !whatsapp || !direccion) {
      alert("Por favor completá todos los campos");
      return;
    }

    const perfil = {
      nombre,
      whatsapp,
      direccion,
      preferencias,
      rol: "viajero",
      fotoPerfil: usuario.photoURL || "",
      fechaRegistro: new Date(),
    };

    try {
      await setDoc(doc(db, "usuarios", usuario.uid), perfil, { merge: true });
      setGuardado(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error guardando perfil de viajero:", error);
      alert("Hubo un error al guardar tu perfil. Intentá nuevamente.");
    }
  };

  const handleCheckbox = (e) => {
    setPreferencias(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4 text-center">🧳 Completá tu perfil de viajero</h2>

      <label className="block mb-2">
        Nombre completo:
        <input
          type="text"
          className="input mt-1"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
      </label>

      <label className="block mb-2">
        WhatsApp:
        <input
          type="text"
          className="input mt-1"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        Dirección:
        <input
          type="text"
          className="input mt-1"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
        />
      </label>

      <div className="card mb-4">
        <h4 className="mb-2 font-semibold">Preferencias</h4>
        {Object.entries(preferencias).map(([key, val]) => (
          <label key={key} className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name={key}
              checked={val}
              onChange={handleCheckbox}
            />
            {key === "mascotas" && "Acepta mascotas"}
            {key === "musica" && "Escucha música"}
            {key === "fumar" && "Permite fumar"}
            {key === "aire" && "Usa aire acondicionado"}
          </label>
        ))}
      </div>

      <button
        className="btn btn-primary w-full"
        onClick={guardarPerfil}
      >
        Guardar perfil
      </button>

      {guardado && (
        <p className="mt-2 text-center text-green-600">
          ✅ Perfil guardado. Redirigiendo...
        </p>
      )}
    </div>
  );
}
