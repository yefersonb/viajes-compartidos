import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

function SeleccionarRol({ usuario, setRol }) {
  const elegirRol = async (rolElegido) => {
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), {
        nombre: usuario.displayName,
        email: usuario.email,
        rol: rolElegido,
      });

      localStorage.setItem("rolSeleccionado", rolElegido); // 🧠 lo guardamos localmente
      setRol(rolElegido); // 🔄 actualizamos el estado
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
        className="bg-blue-500 text-white px-4 py-2 rounded m-2"
      >
        Conducir
      </button>
      <button
        onClick={() => elegirRol("viajero")}
        className="bg-green-500 text-white px-4 py-2 rounded m-2"
      >
        Viajar
      </button>
    </div>
  );
}

export default SeleccionarRol;
