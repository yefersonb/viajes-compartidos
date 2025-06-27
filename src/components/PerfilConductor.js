import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PerfilConductor() {
  const { usuario } = useUser();
  const [whatsapp, setWhatsapp] = useState("");
  const [preferencias, setPreferencias] = useState({
    mascotas: false,
    musica: true,
    fumar: false,
    aire: true,
  });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const cargarPerfil = async () => {
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setWhatsapp(data.whatsapp || "");
        setPreferencias(data.preferencias || preferencias);
      }
    };
    cargarPerfil();
  }, [usuario]);

  const guardarPerfil = async () => {
    if (!whatsapp) {
      alert("Por favor, ingresá tu número de WhatsApp");
      return;
    }

    const perfil = {
      nombre: usuario.displayName,
      fotoPerfil: usuario.photoURL,
      whatsapp,
      preferencias,
      verificado: false,
      fechaRegistro: new Date(),
    };

    await setDoc(doc(db, "usuarios", usuario.uid), perfil, { merge: true });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const handleCheckbox = (e) => {
    setPreferencias({
      ...preferencias,
      [e.target.name]: e.target.checked,
    });
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <h2>📋 Tu perfil como conductor</h2>
      <label>
        WhatsApp:{" "}
        <input
          type="text"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="Ej: 3751556677"
        />
      </label>
      <div>
        <h4>Preferencias</h4>
        <label>
          <input
            type="checkbox"
            name="mascotas"
            checked={preferencias.mascotas}
            onChange={handleCheckbox}
          />
          Acepta mascotas
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="musica"
            checked={preferencias.musica}
            onChange={handleCheckbox}
          />
          Escucha música
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="fumar"
            checked={preferencias.fumar}
            onChange={handleCheckbox}
          />
          Permite fumar
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            name="aire"
            checked={preferencias.aire}
            onChange={handleCheckbox}
          />
          Usa aire acondicionado
        </label>
      </div>
      <button onClick={guardarPerfil}>Guardar perfil</button>
      {guardado && <p>✅ Perfil guardado con éxito</p>}
    </div>
  );
}
