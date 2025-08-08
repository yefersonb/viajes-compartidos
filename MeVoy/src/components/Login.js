import React, { useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserContext";
import GLoginButton from "./google/GLoginButton";

export default function Login() {
  const { usuario, setUsuario } = useUser();
  const [whatsapp, setWhatsapp] = useState("");
  const [pidiendoWhatsapp, setPidiendoWhatsapp] = useState(false);
  const [userTemp, setUserTemp] = useState(null);

  const loginConGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Buscamos si el usuario ya tiene documento
      const userRef = doc(db, "usuarios", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().whatsapp) {
        setUsuario(user);
      } else {
        setUserTemp(user);
        setPidiendoWhatsapp(true);
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al iniciar sesión");
    }
  };

  const guardarWhatsapp = async () => {
    if (!userTemp) return;
    if (!whatsapp) {
      alert("Ingresá tu número de WhatsApp");
      return;
    }
    try {
      await setDoc(doc(db, "usuarios", userTemp.uid), {
        nombre: userTemp.displayName,
        whatsapp: whatsapp,
        email: userTemp.email,
      });
      setUsuario(userTemp);
      setPidiendoWhatsapp(false);
    } catch (error) {
      alert("Error guardando WhatsApp");
      console.error(error);
    }
  };

  if (usuario) return null;

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <img
          src="/assets/logo_mevoy_nobg_dark.png"
          alt="[Logo de MeVoy]"
          style={{ marginTop: "5rem", width: "10rem" }}
        />
        <div style={{ marginTop: "2rem", opacity: 0.5 }}> Iniciá sesión </div>
      </div>
      <GLoginButton onClick={loginConGoogle} />
      {pidiendoWhatsapp && (
        <div style={{ marginTop: 20 }}>
          <h4>Completá tu WhatsApp para continuar:</h4>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 3756123456"
          />
          <button onClick={guardarWhatsapp}>Guardar</button>
        </div>
      )}
    </div>
  );
}