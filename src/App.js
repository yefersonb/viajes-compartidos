// src/App.js
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
  setDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./App.css";
import Login from "./components/Login";
import SeleccionarRol from "./components/SeleccionarRol";
import PerfilConductor from "./components/PerfilConductor";
import VehiculosConductor from "./components/VehiculosConductor";
import NuevoViaje from "./components/NuevoViaje";
import BuscadorViajes from "./components/BuscadorViajes";
import PerfilViajero from "./components/PerfilViajero";

const modalStyles = { /* estilos previos */ };

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [reservas, setReservas] = useState({});
  const [mostrarSelectorRol, setMostrarSelectorRol] = useState(false);
  const [mostrarVehiculos, setMostrarVehiculos] = useState(false);
  const [reservaActiva, setReservaActiva] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const stored = localStorage.getItem("rolSeleccionado");
        if (stored) setRol(stored);
        else {
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

  useEffect(() => {
    const verificarPerfil = async () => {
      if (!usuario || rol !== "viajero") return;
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const completo = data.whatsapp && data.nombre && data.direccion;
        setPerfilCompleto(!!completo);
      } else {
        await setDoc(ref, {
          rol: "viajero",
          nombre: usuario.displayName || usuario.email,
          fotoPerfil: usuario.photoURL || "",
          fechaRegistro: new Date(),
        });
        setPerfilCompleto(false);
      }
    };
    verificarPerfil();
  }, [usuario, rol]);

  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "viajes"), orderBy("horario", "asc"));
    const unsubV = onSnapshot(q, (snap) => {
      setViajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    let unsubR = () => {};
    if (rol === "conductor") {
      unsubR = onSnapshot(q, async (snap) => {
        const temp = {};
        for (const d of snap.docs.filter((d) => d.data().conductor?.uid === usuario.uid)) {
          const rs = await getDocs(collection(db, "viajes", d.id, "reservas"));
          temp[d.id] = rs.docs.map((r) => r.data());
        }
        setReservas(temp);
      });
    }
    return () => {
      unsubV();
      unsubR();
    };
  }, [usuario, rol]);

  const cerrarSesion = async () => await signOut(auth);

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
      alert("¡Reserva exitosa!");
    } catch (e) {
      console.error(e);
      alert("Hubo un problema al reservar");
    }
  };

  if (loading) return <p>Cargando...</p>;

  if (rol === "viajero" && !perfilCompleto) return <PerfilViajero usuario={usuario} />;

  return (
    <div className="app-container">
      <h1>🚗 Viajes Compartidos</h1>
      {!usuario ? (
        <Login onLogin={setUsuario} />
      ) : (
        <>
          <div className="user-header">
            <p>Hola, {usuario.displayName || usuario.email} ({rol})</p>
            <button onClick={cerrarSesion}>Cerrar sesión</button>
            <button onClick={() => setMostrarSelectorRol(true)}>Cambiar rol</button>
          </div>

          {mostrarSelectorRol && (
            <div style={modalStyles.overlay}>
              <div style={modalStyles.content}>
                <button style={modalStyles.closeBtn} onClick={() => setMostrarSelectorRol(false)}>×</button>
                <SeleccionarRol
                  usuario={usuario}
                  setRol={(r) => { setRol(r); localStorage.setItem("rolSeleccionado", r); setMostrarSelectorRol(false); }}
                />
              </div>
            </div>
          )}

          {rol === "conductor" && (
            <>
              <PerfilConductor />
              <button onClick={() => setMostrarVehiculos((v) => !v)}>
                {mostrarVehiculos ? "Ocultar mis vehículos" : "Mis Vehículos"}
              </button>
              {mostrarVehiculos && <VehiculosConductor />}
              <NuevoViaje />
              <h3>Reservas Recibidas</h3>
              {viajes.filter((v) => reservas[v.id]).map((v) => (
                <div key={v.id} style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                  <h4 className="font-semibold">{v.origen} → {v.destino}</h4>
                  <p>Vehículo: {v.vehiculo || '—'}</p>
                  <p>Horario: {new Date(v.horario).toLocaleString()}</p>
                  <ul>
                    {reservas[v.id].length === 0 ? (
                      <li>Sin reservas aún</li>
                    ) : (
                      reservas[v.id].map((r, i) => (
                        <li key={i}>
                          <button onClick={() => setReservaActiva({ parcela: r, viaje: v })}>
                            {r.nombre} {r.whatsapp ? `(WA:${r.whatsapp})` : ''}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
              {reservaActiva && (
                <DetalleReserva
                  viaje={reservaActiva.viaje}
                  pasajero={reservaActiva.parcela}
                  onClose={() => setReservaActiva(null)}
                  onConfirm={() => { reservarViaje(reservaActiva.viaje.id); setReservaActiva(null); }}
                />
              )}
            </>
          )}

          {rol === "viajero" && (
            <>
              <h3>Viajes Publicados</h3>
              <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <BuscadorViajes viajes={viajes} usuario={usuario} onReservar={reservarViaje} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function DetalleReserva({ viaje, pasajero, onClose, onConfirm }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <button style={modalStyles.closeBtn} onClick={onClose}>×</button>
        <img src={pasajero.photoURL || '/default-avatar.png'} alt={pasajero.nombre} style={{ width: 80, borderRadius: '50%' }} />
        <h2>{pasajero.nombre}</h2>
        <p><strong>Dirección:</strong> {pasajero.direccion || '—'}</p>
        <p><strong>Reputación:</strong> {pasajero.reputacion ?? 'Sin calificar'}</p>
        <p><strong>Viaje:</strong> {viaje.origen} → {viaje.destino}</p>
        <p><strong>Horario:</strong> {new Date(viaje.horario).toLocaleString()}</p>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={onConfirm}>Confirmar</button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
