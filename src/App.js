// App.js
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
  const [mostrarSelectorRol, setMostrarSelectorRol] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [reservas, setReservas] = useState({});

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
            if (rolBD) {
              setRol(rolBD);
              localStorage.setItem("rolSeleccionado", rolBD);
            }
          }
        }
      } else {
        setRol(null);
        localStorage.removeItem("rolSeleccionado");
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!usuario || rol !== "viajero") return;
    const q = query(collection(db, "viajes"), orderBy("horario", "asc"));
    const unsubscribeViajes = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setViajes(datos);
    });
    return () => unsubscribeViajes();
  }, [usuario, rol]);

  useEffect(() => {
    if (!usuario || rol !== "conductor") return;
    const q = query(collection(db, "viajes"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const viajesDelConductor = snapshot.docs
        .filter((doc) => doc.data().conductor?.uid === usuario.uid)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      const todasLasReservas = {};
      for (let viaje of viajesDelConductor) {
        const resSnap = await getDocs(collection(db, "viajes", viaje.id, "reservas"));
        todasLasReservas[viaje.id] = resSnap.docs.map((d) => d.data());
      }
      setReservas(todasLasReservas);
    });
    return () => unsubscribe();
  }, [usuario, rol]);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      setRol(null);
      localStorage.removeItem("rolSeleccionado");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión.");
    }
  };

  const reservarViaje = async (viajeId) => {
    try {
      const reserva = {
        uid: usuario.uid,
        nombre: usuario.displayName || usuario.email,
        whatsapp: usuario.phoneNumber || "sin teléfono",
        fechaReserva: new Date(),
      };
      await addDoc(collection(db, "viajes", viajeId, "reservas"), reserva);
      await updateDoc(doc(db, "viajes", viajeId), {
        asientos: increment(-1),
      });
      alert("¡Reserva realizada con éxito! 🙌");
    } catch (error) {
      console.error("Error al reservar:", error);
      alert("Hubo un problema al reservar el viaje.");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="app-container">
      <h1>🚗 Viajes Compartidos</h1>
      {!usuario ? (
        <>
          <p>Iniciar sesión</p>
          <Login onLogin={setUsuario} />
        </>
      ) : (
        <>
          <p>
            Hola, {usuario.displayName || usuario.email}{" "}
            <span className="role-badge">({rol})</span>
          </p>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
          <button
            className="change-role-btn"
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
                  setRol={(nuevoRol) => {
                    setRol(nuevoRol);
                    localStorage.setItem("rolSeleccionado", nuevoRol);
                    setMostrarSelectorRol(false);
                  }}
                />
              </div>
            </div>
          )}

          <hr />

          {rol === "conductor" && (
            <div className="card">
              <PerfilConductor />
              <hr />
              <MisVehiculos />
              <hr />
              <NuevoVehiculo />
              <hr />
              <NuevoViaje />
              <hr />
              <h3>Reservas Recibidas</h3>
              {Object.entries(reservas).map(([viajeId, lista]) => (
                <div key={viajeId} style={{ marginBottom: "1rem" }}>
                  <strong>Viaje ID:</strong> {viajeId}
                  <ul>
                    {lista.map((r, i) => (
                      <li key={i}>
                        {r.nombre} - <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer">{r.whatsapp}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {rol === "viajero" && (
            <>
              <BuscadorViajes viajes={viajes} onBuscar={setBusqueda} />
              <h2>Viajes Disponibles</h2>
              {viajes.length === 0 ? (
                <p>No hay viajes publicados.</p>
              ) : (
                <ul className="viajes-list">
                  {(busqueda
                    ? viajes.filter(
                        (v) =>
                          v.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
                          v.destino.toLowerCase().includes(busqueda.toLowerCase())
                      )
                    : viajes
                  ).map((v) => (
                    <li key={v.id}>
                      <strong>
                        {v.origen} → {v.destino}
                      </strong>
                      <br />
                      Fecha: {v.horario}
                      <br />
                      Asientos disponibles: {v.asientos}
                      <br />
                      Contacto: <a href={`https://wa.me/${v.conductor.whatsapp}`} target="_blank" rel="noopener noreferrer">{v.conductor.nombre}</a>
                      <br />
                      <button onClick={() => reservarViaje(v.id)} disabled={v.asientos <= 0}>
                        {v.asientos > 0 ? "Reservar" : "Sin asientos"}
                      </button>
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
