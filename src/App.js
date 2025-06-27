import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import Login from "./components/Login";
import SeleccionarRol from "./components/SeleccionarRol";
import PerfilConductor from "./components/PerfilConductor";
import NuevoVehiculo from "./components/NuevoVehiculo";
import MisVehiculos from "./components/MisVehiculos";
import NuevoViaje from "./components/NuevoViaje";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [viajes, setViajes] = useState([]);

  // Escuchar login
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRol(docSnap.data().rol);
        }
      } else {
        setRol(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Escuchar viajes
  useEffect(() => {
    if (!usuario || rol !== "viajero") return; // Solo viajeros ven lista de viajes

    const q = query(collection(db, "viajes"), orderBy("fecha", "asc"));
    const unsubscribeViajes = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setViajes(datos);
    });

    return () => unsubscribeViajes();
  }, [usuario, rol]);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      setRol(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión.");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>🚗 Viajes Compartidos</h1>

      {!usuario ? (
        <>
          <p>Iniciar sesión</p>
          <Login onLogin={setUsuario} />
        </>
      ) : !rol ? (
        <SeleccionarRol usuario={usuario} setRol={setRol} />
      ) : (
        <>
          <p>Hola, {usuario.displayName || usuario.email} ({rol})</p>
          <button onClick={cerrarSesion}>Cerrar sesión</button>

          <hr />

          {rol === "conductor" && (
            <>
              <PerfilConductor />
              <hr />
              <MisVehiculos />
              <hr />
              <NuevoVehiculo />
              <hr />
              <NuevoViaje />
            </>
          )}

          {rol === "viajero" && (
            <>
              <h2>Viajes Disponibles</h2>
              {viajes.length === 0 ? (
                <p>No hay viajes publicados.</p>
              ) : (
                <ul>
                  {viajes.map((v) => (
                    <li key={v.id}>
                      <strong>{v.origen} → {v.destino}</strong><br />
                      Fecha: {v.fecha}<br />
                      Asientos disponibles: {v.asientos}<br />
                      Contacto: <a
                        href={`https://wa.me/${v.conductor.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {v.conductor.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
