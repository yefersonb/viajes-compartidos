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
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./App.css";

// Importar estilos de la librería CozyGlow
import "./components/cozyglow/css/cozyglow.css";

import Login from "./components/Login";
import SeleccionarRol from "./components/SeleccionarRol";
import PerfilConductorV2 from "./components/PerfilConductorV2Enhanced";
import VehiculosConductor from "./components/VehiculosConductor";
import BuscadorViajes from "./components/BuscadorViajes";
import PerfilViajeroPage from "./components/PerfilViajeroPage";
import PagoButton from "./components/PagoButton";
import Header from "./Header";
import ReservasRecibidas from "./components/ReservasRecibidas";
import VerificacionVehiculosAdmin from "./components/vehicleVerification/VerificacionVehiculosAdmin";

const modalStyles = {}; // Puedes agregar estilos si lo deseas

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [reservas, setReservas] = useState({});
  const [mostrarSelectorRol, setMostrarSelectorRol] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(true);
  const [viajeReservado, setViajeReservado] = useState(null);

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
            setRol(snap.data().rol);
            localStorage.setItem("rolSeleccionado", snap.data().rol);
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

  // Validación de completitud para viajero (más tolerante)
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

  // Carga viajes y reservas si es conductor
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

  const cerrarSesion = () => signOut(auth);

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

  if (loading) return <p>Cargando...</p>;
  if (!usuario) return <Login onLogin={setUsuario} />;

  return (
    <div className="app-container">
      <Header />
      <div className="user-header">
        <p>
          Hola, {usuario.displayName || usuario.email} ({rol})
        </p>
        <div className="user-actions">
          <button onClick={cerrarSesion} className="link-btn">
            Cerrar sesión
          </button>
          <button
            onClick={() => setMostrarSelectorRol(true)}
            className="link-btn"
          >
            Cambiar rol
          </button>
          {mostrarSelectorRol && (
            <button
              className="link-btn"
              onClick={() => setMostrarSelectorRol(false)}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {mostrarSelectorRol && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <SeleccionarRol
              usuario={usuario}
              setRol={(r) => {
                setRol(r);
                localStorage.setItem("rolSeleccionado", r);
                setMostrarSelectorRol(false);
              }}
            />
          </div>
        </div>
      )}

      {rol === "conductor" ? (
        <PerfilConductorV2 viajes={viajes} reservas={reservas} />
      ) : rol === "viajero" ? (
        <div>
          {/* Perfil del viajero */}
          <PerfilViajeroPage perfilCompleto={perfilCompleto} />

          {/* Buscador / viajes publicados debajo si querés */}
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
  );
}
