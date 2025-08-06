// src/components/NuevoViaje.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import AutocompleteInput from "./AutocompleteInput";

export default function NuevoViaje() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState(getDefaultDate());
  const [hora, setHora] = useState(getDefaultTime());
  const [asientos, setAsientos] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [vehiculosCargando, setVehiculosCargando] = useState(true);

  // Valores por defecto de fecha y hora
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function getDefaultDate() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`;
  }
  function getDefaultTime() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  // Detectar ubicación inicial para origen
  useEffect(() => {
    if (!origen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${key}`
            );
            const json = await res.json();
            let raw =
              json.results?.[0]?.formatted_address || "Ubicación detectada";
            const clean = raw.replace(/^[A-Z0-9]{4}\+[A-Z0-9]{2},\s*/, "");
            setOrigen({
              formatted_address: clean,
              geometry: {
                location: { lat: () => coords.latitude, lng: () => coords.longitude },
              },
            });
          } catch {
            setOrigen({
              formatted_address: "Ubicación detectada",
              geometry: {
                location: { lat: () => coords.latitude, lng: () => coords.longitude },
              },
            });
          }
        },
        () => {}
      );
    }
  }, [origen]);

  // Cargar vehículos del conductor
  useEffect(() => {
    const loadVehiculos = async () => {
      setVehiculosCargando(true);
      if (!auth.currentUser) {
        setVehiculosCargando(false);
        return;
      }
      try {
        const vehRef = collection(
          db,
          "usuarios",
          auth.currentUser.uid,
          "vehiculos"
        );
        const snap = await getDocs(vehRef);
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setVehiculos(lista);
        if (lista.length === 1) setVehiculoSeleccionado(lista[0]);
      } catch (e) {
        console.error("Error cargando vehículos para nuevo viaje:", e);
      } finally {
        setVehiculosCargando(false);
      }
    };
    loadVehiculos();
  }, []);

  const inputStyle = {
    width: "100%",
    padding: "0.5rem",
    margin: "0.5rem 0",
    border: "1px solid #ccc",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSize: "1rem",
  };

  const publicarViaje = async () => {
  if (!auth.currentUser) {
    alert("⚠️ Iniciá sesión para publicar.");
    return;
  }
  if (!origen || !destino || !fecha || !hora) {
    alert("Completá todos los campos obligatorios.");
    return;
  }
  if (!vehiculoSeleccionado) {
    alert("Seleccioná un vehículo para el viaje.");
    return;
  }

  setLoading(true);
  try {
    const userRef = doc(db, "usuarios", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      alert("Usuario no registrado en la base. Completá tu perfil.");
      return;
    }
    const u = snap.data();

    // Validaciones específicas
    if (!u.nombre && !auth.currentUser.displayName) {
      alert("Tenés que completar tu nombre en el perfil antes de publicar un viaje.");
      return;
    }
    if (!u.whatsapp) {
      alert("Tenés que agregar tu WhatsApp en el perfil antes de publicar un viaje.");
      return;
    }

    // Fallbacks seguros
    const nombreFinal = u.nombre || auth.currentUser.displayName || "Sin nombre";
    const whatsappFinal = u.whatsapp || "";

    const oStr = typeof origen === "object" ? origen.formatted_address : origen;
    const dStr = typeof destino === "object" ? destino.formatted_address : destino;

    let oCoords = null;
    if (origen && origen.geometry && origen.geometry.location) {
      oCoords = {
        lat: origen.geometry.location.lat(),
        lng: origen.geometry.location.lng(),
      };
    }
    let dCoords = null;
    if (destino && destino.geometry && destino.geometry.location) {
      dCoords = {
        lat: destino.geometry.location.lat(),
        lng: destino.geometry.location.lng(),
      };
    }

    const fechaHora = `${fecha}T${hora}`;

    await addDoc(collection(db, "viajes"), {
      origen: oStr,
      destino: dStr,
      origenCoords: oCoords,
      destinoCoords: dCoords,
      fecha,
      horario: fechaHora,
      asientos,
      creado: new Date(),
      conductor: {
        uid: auth.currentUser.uid,
        nombre: nombreFinal,
        whatsapp: whatsappFinal,
      },
      vehiculo: {
        id: vehiculoSeleccionado.id,
        marca: vehiculoSeleccionado.marca || null,
        modelo: vehiculoSeleccionado.modelo || null,
        patente: vehiculoSeleccionado.patente || null,
        asientos: vehiculoSeleccionado.asientos || null,
      },
    });

    alert("✅ Viaje publicado");
    // Resetear formulario
    setOrigen("");
    setDestino("");
    setFecha(getDefaultDate());
    setHora(getDefaultTime());
    setAsientos(1);
    setVehiculoSeleccionado(vehiculos.length === 1 ? vehiculos[0] : null);
  } catch (e) {
    console.error(e);
    alert("Error al publicar: " + (e.message || "Ocurrió un problema."));
  } finally {
    setLoading(false);
  }
};


  const incompleto =
    !origen || !destino || !fecha || !hora || asientos < 1 || !vehiculoSeleccionado;

  return (
    <section style={{ padding: "1rem" }}>
      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="origen" style={{ display: "block", fontWeight: 500 }}>
          Origen
        </label>
        <AutocompleteInput
          id="origen"
          placeholder="Ingresa origen"
          value={typeof origen === "object" ? origen.formatted_address : origen}
          onChange={setOrigen}
          style={inputStyle}
        />
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <label htmlFor="destino" style={{ display: "block", fontWeight: 500 }}>
          Destino
        </label>
        <AutocompleteInput
          id="destino"
          placeholder="Ingresa destino"
          value={
            typeof destino === "object" ? destino.formatted_address : destino
          }
          onChange={setDestino}
          style={inputStyle}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 16,
        }}
      >
        <div style={{ margin: "0.5rem 0" }}>
          <label htmlFor="fecha" style={{ display: "block", fontWeight: 500 }}>
            Fecha de viaje
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ margin: "0.5rem 0" }}>
          <label htmlFor="hora" style={{ display: "block", fontWeight: 500 }}>
            Hora de viaje
          </label>
          <input
            id="hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ margin: "0.5rem 0" }}>
          <label
            htmlFor="asientos"
            style={{ display: "block", fontWeight: 500 }}
          >
            Cantidad de asientos
          </label>
          <input
            id="asientos"
            type="number"
            min={1}
            value={asientos}
            onChange={(e) => setAsientos(+e.target.value)}
            style={{ ...inputStyle, appearance: "auto", MozAppearance: "textfield" }}
          />
        </div>
      </div>

      <div style={{ margin: "0.5rem 0" }}>
        <div style={{ fontWeight: 500, marginBottom: 6 }}>Vehículo</div>
        {vehiculosCargando ? (
          <div style={{ color: "#555" }}>Cargando vehículos...</div>
        ) : vehiculos.length === 0 ? (
          <div style={{ color: "#c0392b" }}>
            No tenés vehículos cargados. Agregá uno en la pestaña{" "}
            <strong>Vehículos</strong>.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              aria-label="Seleccionar vehículo"
              value={vehiculoSeleccionado?.id || ""}
              onChange={(e) => {
                const sel = vehiculos.find((v) => v.id === e.target.value);
                setVehiculoSeleccionado(sel || null);
              }}
              style={{
                ...inputStyle,
                maxWidth: 320,
                flex: '1 1 260px'
              }}
            >
              <option value="" disabled>
                Seleccioná vehículo
              </option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {`${v.marca || ''} ${v.modelo || ''}`.trim()}{' '}
                  {v.patente ? `- ${v.patente}` : ''}
                </option>
              ))}
            </select>
            {vehiculoSeleccionado && (
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f9fafe',
                  fontSize: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div>
                    <strong>
                      {vehiculoSeleccionado.marca || 'Sin marca'}{' '}
                      {vehiculoSeleccionado.modelo || ''}
                    </strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#555' }}>
                    {vehiculoSeleccionado.patente && (
                      <span>Patente: {vehiculoSeleccionado.patente}</span>
                    )}
                    {vehiculoSeleccionado.asientos != null && (
                      <span style={{ marginLeft: 8 }}>
                        Asientos: {vehiculoSeleccionado.asientos}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={publicarViaje}
        disabled={incompleto || loading}
        className="btn-rounded highlight-hover"
        style={{
          width: "100%",
          marginTop: 8,
          padding: "12px",
          fontWeight: 600,
          borderRadius: 6,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          cursor: incompleto || loading ? "not-allowed" : "pointer",
          opacity: incompleto || loading ? 0.6 : 1,
        }}
      >
        {loading ? "Publicando..." : "Publicar Viaje"}
      </button>
    </section>
  );
}
