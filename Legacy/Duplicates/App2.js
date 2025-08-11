import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import "./App.css";

import Login from "./components/Login";
import Logout from "./components/Logout";
import SeleccionarRol from "./components/SeleccionarRol";
import PerfilConductor from "./components/PerfilConductor";
import NuevoVehiculo from "./components/NuevoVehiculo";
import MisVehiculos from "./components/MisVehiculos";
import NuevoViaje from "./components/NuevoViaje";
import BuscadorViajes from "./components/BuscadorViajes";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viajes, setViajes] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "viajes"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viajesActualizados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setViajes(viajesActualizados);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      {usuario ? (
        <>
          <p>Hola, {usuario.displayName}</p>
          <Logout />
          <SeleccionarRol />
          <PerfilConductor />
          <NuevoVehiculo />
          <MisVehiculos />
          <NuevoViaje />
          <BuscadorViajes viajes={viajes} />
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
