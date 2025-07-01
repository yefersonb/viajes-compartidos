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
  getDocs,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import "./App.css";
import Login from "./components/Login";
import SeleccionarRol from "./components/SeleccionarRol";
import PerfilConductor from "./components/PerfilConductor";
import NuevoVehiculo from "./components/NuevoVehiculo";
import MisVehiculos from "./components/MisVehiculos";
import NuevoViaje from "./components/NuevoViaje";
import BuscadorViajes from "./components/BuscadorViajes";
import DetalleViaje from "./components/DetalleViaje";
// import PerfilViajero disabled

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
  },
  content: {
    backgroundColor: "#fff",
    padding: "30px 40px",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "#e74c3c",
    border: "none",
    borderRadius: "50%",
    color: "white",
    width: "28px",
    height: "28px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  changeRoleBtn: {
    position: "fixed",
    top: 10,
    right: 10,
    backgroundColor: "#f39c12",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    zIndex: 1000,
  },
};

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [reservas, setReservas] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSelectorRol, setMostrarSelectorRol] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const localRol = localStorage.getItem("rolSeleccionado");
        if (localRol) {
          setRol(localRol);
        } else {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const rolBD = docSnap.data().rol;
            setRol(rolBD);
            localStorage.setItem("rolSeleccionado", rolBD);
          }
        }
      } else {
        setRol(null);
        localStorage.removeItem("rolSeleccionado");
      }
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!usuario) return;
    if (rol === "viajero") {
      const q = query(collection(db, "viajes"), orderBy("horario", "asc"));
      return onSnapshot(q, (snap) => {
        setViajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    }
    if (rol === "conductor") {
      const q = query(collection(db, "viajes"));
      return onSnapshot(q, async (snapshot) => {
        const propios = snapshot.docs
          .filter((d) => d.data().conductor?.uid === usuario.uid)
          .map((d) => ({ id: d.id, ...d.data() }));
        setViajes(propios);
        const allRes = {};
        for (let v of propios) {
          const resSnap = await getDocs(collection(db, "viajes", v.id, "reservas"));
          allRes[v.id] = resSnap.docs.map((r) => r.data());
        }
        setReservas(allRes);
      });
    }
  }, [usuario, rol]);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
      alert("Error al cerrar sesión");
    }
  };

  const reservarViaje = async (viajeId) => {
    try {
      const reserva = {
        uid: usuario.uid,
        nombre: usuario.displayName || usuario.email,
        whatsapp: usuario.phoneNumber || "",
        fechaReserva: new Date(),
      };
      await addDoc(collection(db, "viajes", viajeId, "reservas"), reserva);
      await updateDoc(doc(db, "viajes", viajeId), { asientos: increment(-1) });
      alert("¡Reserva exitosa!");
      setViajeSeleccionado(null);
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al reservar");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="app-container">
      <h1>🚗 Viajes Compartidos</h1>
      {!usuario ? (
        <Login onLogin={setUsuario} />
      ) : (
        <>
          <p>Hola, {usuario.displayName || usuario.email} <span>({rol})</span></p>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
          <button
            style={modalStyles.changeRoleBtn}
            onClick={() => setMostrarSelectorRol(true)}
            title="Cambiar rol"
          >
            Cambiar rol
          </button>
          {mostrarSelectorRol && (
            <div style={modalStyles.overlay}>
              <div style={modalStyles.content}>
                <button
                  style={modalStyles.closeBtn}
                  onClick={() => setMostrarSelectorRol(false)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <SeleccionarRol
                  usuario={usuario}
                  setRol={(r) => { setRol(r); localStorage.setItem("rolSeleccionado", r); setMostrarSelectorRol(false); }}
                />
              </div>
            </div>
          )}

          {rol === "conductor" && (
            <div>
              <PerfilConductor />
              <MisVehiculos />
              <NuevoVehiculo />
              <NuevoViaje />
              <h3>Reservas Recibidas</h3>
              {Object.entries(reservas).map(([id, list]) => (
                <div key={id}>
                  <strong>Viaje {id}</strong>
                  <ul>
                    {list.map((r, i) => (
                      <li key={i}>{r.nombre} - <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer">{r.whatsapp}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {rol === "viajero" && (
            <div>
              <BuscadorViajes viajes={viajes} onBuscar={setBusqueda} />
              <h2>Viajes Disponibles</h2>
              {viajes.length === 0 ? (
                <p>No hay viajes publicados.</p>
              ) : (
                <ul className="viajes-list">
                  {viajes
                    .filter(v =>
                      busqueda
                        ? v.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
                          v.destino.toLowerCase().includes(busqueda.toLowerCase())
                        : true
                    )
                    .map(v => (
                      <li key={v.id} style={{ marginBottom: '1rem' }}>
                        <strong>{v.origen} → {v.destino}</strong><br/>
                        Fecha: {v.horario}<br/>
                        Asientos: {v.asientos}<br/>
                        <button onClick={() => reservarViaje(v.id)} disabled={v.asientos <= 0}>
                          {v.asientos > 0 ? "Reservar" : "Sin asientos"}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {viajeSeleccionado && (
            <DetalleViaje viaje={viajeSeleccionado} onReservar={reservarViaje} onClose={() => setViajeSeleccionado(null)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
