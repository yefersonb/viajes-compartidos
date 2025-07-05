// src/components/SeleccionarRol.js
import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

function SeleccionarRol({ usuario, setRol }) {
  const elegirRol = async (rolElegido) => {
    try {
      await setDoc(
        doc(db, "usuarios", usuario.uid),
        {
          rol: rolElegido
        },
        { merge: true }      // ← conserva todos los campos previos
      );

      localStorage.setItem("rolSeleccionado", rolElegido);
      setRol(rolElegido);
    } catch (error) {
      console.error("Error al guardar el rol:", error);
      alert("Hubo un problema al guardar tu rol.");
    }
  };

  return (
    <div className="text-center p-4">
      <h2 className="text-xl font-bold mb-4">¿Cómo querés usar la app?</h2>
      <button
        onClick={() => elegirRol("conductor")}
        className="btn btn-primary mx-2"
      >
        Conducir
      </button>
      <button
        onClick={() => elegirRol("viajero")}
        className="btn btn-secondary mx-2"
      >
        Viajar
      </button>
    </div>
  );
}

export default SeleccionarRol;
