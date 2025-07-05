// src/components/PerfilConductor.js
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PerfilConductor() {
  const { usuario } = useUser();
  const defaultPrefs = { mascotas: false, musica: true, fumar: false, aire: true };

  const [whatsapp, setWhatsapp] = useState("");
  const [hasWhats, setHasWhats] = useState(false);
  const [preferencias, setPreferencias] = useState(defaultPrefs);
  const [guardado, setGuardado] = useState(false);

  // Carga inicial del perfil
  useEffect(() => {
    if (!usuario) return;
    const cargarPerfil = async () => {
      try {
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.whatsapp) {
            setWhatsapp(data.whatsapp);
            setHasWhats(true);
          }
          setPreferencias(prev => data.preferencias ?? prev);
        }
      } catch (error) {
        console.error("Error cargando perfil de conductor:", error);
      }
    };
    cargarPerfil();
  }, [usuario]);

  const guardarPerfil = async () => {
    // Validar WhatsApp solo si aún no existía
    if (!hasWhats && !whatsapp) {
      alert("Por favor, ingresá tu número de WhatsApp");
      return;
    }

    const perfil = {
      nombre: usuario.displayName,
      fotoPerfil: usuario.photoURL,
      rol: "conductor",
      whatsapp,
      preferencias,
      verificado: false,
      fechaRegistro: new Date(),
    };

    try {
      await setDoc(doc(db, "usuarios", usuario.uid), perfil, { merge: true });
      setHasWhats(true);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
      console.log("Perfil conductor guardado:", perfil);
    } catch (error) {
      console.error("Error guardando perfil de conductor:", error);
      alert("Hubo un error al guardar tu perfil. Intentá nuevamente.");
    }
  };

  const handleCheckbox = (e) => {
    setPreferencias(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  // Decide si mostrar input o solo texto de WhatsApp
  const mostrarInput = !hasWhats;

  return (
    <div className="mt-4">
      <h2 className="text-center">📋 Tu perfil como conductor</h2>

      {mostrarInput ? (
        <label className="block mt-4">
          WhatsApp:
          <input
            type="text"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="Ej: 3751556677"
            className="input mt-1"
          />
        </label>
      ) : (
        <p className="mt-4 text-center">
          <strong>WhatsApp:</strong> {whatsapp}
        </p>
      )}

      <div className="card mt-4">
        <h4>Preferencias</h4>
        {Object.entries(preferencias).map(([key, val]) => (
          <label key={key} className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name={key}
              checked={val}
              onChange={handleCheckbox}
              className="mr-2"
            />
            {key === "mascotas" && "Acepta mascotas"}
            {key === "musica" && "Escucha música"}
            {key === "fumar" && "Permite fumar"}
            {key === "aire" && "Usa aire acondicionado"}
          </label>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="btn btn-primary flex-1"
          onClick={guardarPerfil}
        >
          {mostrarInput ? "Guardar WhatsApp y perfil" : "Guardar preferencias"}
        </button>
      </div>

      {guardado && (
        <p className="mt-2 text-center text-green-600">
          ✅ Perfil guardado con éxito
        </p>
      )}
    </div>
  );
}
