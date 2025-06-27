import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function PerfilUsuario() {
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarWhatsapp = async () => {
      if (!auth.currentUser) return setLoading(false);

      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setWhatsapp(docSnap.data().whatsapp || "");
      }

      setLoading(false);
    };

    cargarWhatsapp();
  }, []);

  const guardarWhatsapp = async () => {
    if (!auth.currentUser) return alert("Debes iniciar sesión primero.");

    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      await updateDoc(userRef, { whatsapp });
      alert("WhatsApp actualizado!");
    } catch (error) {
      console.error(error);
      alert("Error actualizando WhatsApp");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h3>Agregar tu WhatsApp</h3>
      <input
        type="text"
        placeholder="Ej: 54937511234567"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
      />
      <button onClick={guardarWhatsapp}>Guardar WhatsApp</button>
    </div>
  );
}
