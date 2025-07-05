// src/components/DetalleViaje.js
import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { MAP_LIBS, MAP_LOADER_ID } from "../googleMapsConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./DetalleViaje.css";

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function DetalleViaje({ viaje, pasajeros, onClose, onReservar, loading }) {
  const { isLoaded } = useJsApiLoader({
    id: MAP_LOADER_ID,
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBS,
  });

  const [directions, setDirections] = useState(null);
  const [distanciaKm, setDistanciaKm] = useState(null);
  const [rutaError, setRutaError] = useState(null);
  const [datosPasajero, setDatosPasajero] = useState(null);

  useEffect(() => {
    if (!isLoaded || !viaje) return;
    const { origenCoords, destinoCoords, origen, destino } = viaje;

    const service = new window.google.maps.DirectionsService();
    const req = (orig, dest) =>
      new Promise((resolve) =>
        service.route(
          { origin: orig, destination: dest, travelMode: window.google.maps.TravelMode.DRIVING },
          (res, status) => resolve({ res, status })
        )
      );

    if (origenCoords && destinoCoords) {
      const oLL = new window.google.maps.LatLng(origenCoords.lat, origenCoords.lng);
      const dLL = new window.google.maps.LatLng(destinoCoords.lat, destinoCoords.lng);
      req(oLL, dLL).then(({ res, status }) => {
        if (status === "OK" && res.routes?.length) {
          setDirections(res);
          setDistanciaKm((res.routes[0].legs[0].distance.value / 1000).toFixed(1));
        } else {
          req(origen, destino).then(({ res: r2, status: s2 }) => {
            if (s2 === "OK" && r2.routes?.length) {
              setDirections(r2);
              setDistanciaKm((r2.routes[0].legs[0].distance.value / 1000).toFixed(1));
            } else {
              setDistanciaKm(haversineKm(origenCoords, destinoCoords).toFixed(1));
              setRutaError("ℹ️ Ruta aproximada en línea recta.");
            }
          });
        }
      });
    } else {
      setRutaError("⚠️ No hay coordenadas guardadas para este viaje.");
    }
  }, [isLoaded, viaje]);

  useEffect(() => {
    if (!viaje?.uidPasajero) return;
    const fetchPasajero = async () => {
      const ref = doc(db, "usuarios", viaje.uidPasajero);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDatosPasajero(snap.data());
      }
    };
    fetchPasajero();
  }, [viaje?.uidPasajero]);

  if (!viaje) return null;

  const center = viaje.origenCoords || { lat: -34.6, lng: -58.38 };
  const precio = distanciaKm ? Math.round(distanciaKm * 70) : null;

  return (
    <div className="dv-overlay" onClick={onClose}>
      <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dv-close" onClick={onClose}>×</button>
        <h2>Detalle de Viaje</h2>

        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "300px" }}
            center={center}
            zoom={8}
          >
            {directions ? <DirectionsRenderer directions={directions} /> : <Marker position={center} />}
          </GoogleMap>
        ) : (
          <p>Cargando mapa…</p>
        )}

        {rutaError && <p className="dv-error">{rutaError}</p>}

        <div className="dv-info">
          <p><strong>Origen:</strong> {viaje.origen}</p>
          <p><strong>Destino:</strong> {viaje.destino}</p>
          <p><strong>Horario:</strong> {viaje.horario}</p>
          <p><strong>Asientos disponibles:</strong> {viaje.asientos}</p>
          {distanciaKm && (
            <>
              <p><strong>Distancia:</strong> {distanciaKm} km</p>
              <p><strong>Precio estimado:</strong> ${precio}</p>
            </>
          )}
          {pasajeros > viaje.asientos && (
            <p className="dv-error">No hay suficientes asientos para {pasajeros} pasajeros.</p>
          )}
        </div>

        {datosPasajero && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-bold mb-2">🧍 Datos del Viajero</h3>
            <img src={datosPasajero.fotoPerfil} alt="foto perfil" className="w-16 h-16 rounded-full mb-2" />
            <p><strong>Nombre:</strong> {datosPasajero.nombre}</p>
            <p><strong>WhatsApp:</strong> {datosPasajero.whatsapp}</p>
            <p><strong>Dirección:</strong> {datosPasajero.direccion}</p>
            <p>
              <strong>Reputación:</strong> {datosPasajero.reputacion ? (
                <span>{"⭐".repeat(Math.round(datosPasajero.reputacion))} ({datosPasajero.reputacion.toFixed(1)})</span>
              ) : (
                "Sin calificaciones aún"
              )}
            </p>
          </div>
        )}

        <div className="dv-actions">
          <button onClick={onClose} disabled={loading}>Volver</button>
          <button
            onClick={onReservar}
            disabled={loading || viaje.asientos <= 0}
          >
            {loading ? "Reservando..." : viaje.asientos > 0 ? "Confirmar Reserva" : "Sin asientos"}
          </button>
        </div>
      </div>
    </div>
  );
}
