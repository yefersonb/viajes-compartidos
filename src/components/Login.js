import React from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserContext";

export default function Login() {
  const { usuario, setUsuario } = useUser();

  const loginConGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Guardamos o actualizamos el usuario en Firestore
      const userRef = doc(db, "usuarios", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          nombre: user.displayName,
          whatsapp: prompt("Ingresa tu número de WhatsApp (solo números, sin + ni espacios):"),
        });
      }

      setUsuario(user);
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al iniciar sesión");
    }
  };

  if (usuario) return null; // si ya está logueado, no mostrar nada

  return (
    <button onClick={loginConGoogle}>Iniciar sesión con Google</button>
  );
}
