// src/App.js — Componente principal de la aplicación
import React, { useState, useEffect } from "react";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import { ThemeProvider } from "./contexts/ThemeContext";
import "./App.css";

import "./styles/cozyglow/cozyglow.css";                // Import cozyglow base
import "./styles/cozyglow/primitives.css";              // Import cozyglow color primitives
// import "./styles/cozyglow/color_themes/mvclassic.css";  // Import cozyglow color theme
import "./styles/cozyglow/color_themes/natura.css";  // Import cozyglow color theme
//

import CozySpinner from "./components/cozyglow/components/Spinners/CozySpinner/CozySpinner";

import Login from "./components/Login";
import PerfilConductorV2 from "./components/PerfilConductorV2Enhanced";
import BuscadorViajes from "./components/BuscadorViajes";
import PerfilViajeroPage from "./components/PerfilViajeroPage";
import PagoButton from "./components/PagoButton";
import Header from "./components/Header";
import VerificacionVehiculosAdmin from "./components/vehicleVerification/VerificacionVehiculosAdmin";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [reservas, setReservas] = useState({});
  const [perfilCompleto, setPerfilCompleto] = useState(true);
  const [viajeReservado, setViajeReservado] = useState(null);

  // Auth + rol inicial
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const stored = localStorage.getItem("rolSeleccionado");
        if (stored) {
          setRol(stored);
        } else {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const rolDb = snap.data().rol || "viajero";
            setRol(rolDb);
            localStorage.setItem("rolSeleccionado", rolDb);
          } else {
            await setDoc(
              doc(db, "usuarios", user.uid),
              { rol: "viajero" },
              { merge: true }
            );
            setRol("viajero");
            localStorage.setItem("rolSeleccionado", "viajero");
          }
        }
      } else {
        setRol(null);
        localStorage.removeItem("rolSeleccionado");
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Completar perfil mínimo para viajero
  useEffect(() => {
    if (!usuario || rol !== "viajero") return;
    (async () => {
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const tieneNombre = data.nombre || usuario.displayName;
        const tieneWhatsapp = data.whatsapp || usuario.phoneNumber;
        const tieneDireccion = !!data.direccion;
        setPerfilCompleto(!!(tieneNombre && tieneWhatsapp && tieneDireccion));
      } else {
        await setDoc(ref, {
          rol: "viajero",
          nombre: usuario.displayName || usuario.email,
          fotoPerfil: usuario.photoURL || "",
          fechaRegistro: new Date(),
        });
        setPerfilCompleto(false);
      }
    })();
  }, [usuario, rol]);

  // Cargar viajes y reservas si es conductor
  useEffect(() => {
    if (!usuario || rol !== "conductor") return;
    const q = query(collection(db, "viajes"), orderBy("horario", "asc"));
    const unsubV = onSnapshot(q, async (snap) => {
      const misViajes = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((v) => v.conductor?.uid === usuario.uid);
      setViajes(misViajes);

      const temp = {};
      for (const v of misViajes) {
        const rs = await getDocs(collection(db, "viajes", v.id, "reservas"));
        temp[v.id] = rs.docs.map((r) => r.data());
      }
      setReservas(temp);
    });
    return () => unsubV();
  }, [usuario, rol]);

  // Toggle de rol (Header)
  const handleToggleRol = async () => {
    if (!usuario) return;
    const nuevoRol = rol === "viajero" ? "conductor" : "viajero";
    try {
      await setDoc(
        doc(db, "usuarios", usuario.uid),
        { rol: nuevoRol },
        { merge: true }
      );
      localStorage.setItem("rolSeleccionado", nuevoRol);
      setRol(nuevoRol);
    } catch (error) {
      console.error("Error al cambiar el rol:", error);
    }
  };

  // Reservar viaje (viajero)
  const reservarViaje = async (id) => {
    try {
      const data = {
        uid: usuario.uid,
        nombre: usuario.displayName || usuario.email,
        whatsapp: usuario.phoneNumber || "",
        fechaReserva: new Date(),
      };
      await addDoc(collection(db, "viajes", id, "reservas"), data);
      await updateDoc(doc(db, "viajes", id), { asientos: increment(-1) });
      setViajeReservado(viajes.find((v) => v.id === id));
      alert("¡Reserva exitosa! Ahora podés pagar el viaje.");
    } catch (e) {
      console.error(e);
      alert("Hubo un problema al reservar");
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <CozySpinner />
      </ThemeProvider>
    );
  }

  if (!usuario) {
    return (
      <ThemeProvider>
        <Login onLogin={setUsuario} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="app-container">
        {/* Header con toggle de rol */}
        <Header rol={rol} onToggleRol={handleToggleRol} />

        {rol === "conductor" ? (
          <PerfilConductorV2 viajes={viajes} reservas={reservas} />
        ) : rol === "viajero" ? (
          <div>
            <PerfilViajeroPage perfilCompleto={perfilCompleto} />

            <div style={{ marginTop: 32 }}>
              <h3>Buscar viajes</h3>
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <BuscadorViajes
                  viajes={viajes}
                  usuario={usuario}
                  onReservar={reservarViaje}
                />
              </div>

              {viajeReservado && (
                <div style={{ marginTop: 16 }}>
                  <PagoButton viaje={viajeReservado} usuario={usuario} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <VerificacionVehiculosAdmin />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
