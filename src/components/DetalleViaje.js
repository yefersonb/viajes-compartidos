// src/components/DetalleViaje.js
import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { MAP_LIBS, MAP_LOADER_ID } from "../googleMapsConfig";
import "./DetalleViaje.css";

export default function DetalleViaje({ viaje, onReservar, onClose }) {
  const { isLoaded } = useJsApiLoader({
    id: MAP_LOADER_ID,
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBS,
  });

  // ───────── States para la ruta y la distancia ─────────
  const [directions, setDirections] = useState(null);
  const [distanciaKm, setDistanciaKm] = useState(null);

  if (!viaje) return null;

  const origenCoords = viaje?.origenCoords;
  const destinoCoords = viaje?.destinoCoords;
  const center = origenCoords ?? null;

  // ───────── Pide la trayectoria al DirectionsService ─────────
  useEffect(() => {
    if (isLoaded && origenCoords && destinoCoords) {
      const service = new window.google.maps.DirectionsService();

      service.route(
        {
          origin:      origenCoords,
          destination: destinoCoords,
          travelMode:  window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);

            // Distancia en metros → km con 1 decimal
            const metros = result.routes[0].legs[0].distance.value;
            setDistanciaKm((metros / 1000).toFixed(1));
          }
        }
      );
    }
  }, [isLoaded, origenCoords, destinoCoords]);

  // Precio estimado (70 $ por km)
  const precio = distanciaKm ? Math.round(distanciaKm * 70) : null;

  return (
    <div className="dv-overlay" onClick={onClose}>
      <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dv-close" onClick={onClose}>
          ×
        </button>
        <h2>Detalle de Viaje</h2>

        {isLoaded && center ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "300px" }}
            center={center}
            zoom={10}
          >
            {directions ? (
              <DirectionsRenderer directions={directions} />
            ) : (
              // Mientras no llega la ruta, mostramos marcador de origen
              <Marker position={center} />
            )}
          </GoogleMap>
        ) : (
          <p>Cargando mapa…</p>
        )}

        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Origen:</strong> {viaje.origen}
          </p>
          <p>
            <strong>Destino:</strong> {viaje.destino}
          </p>
          <p>
            <strong>Horario:</strong> {viaje.horario}
          </p>
          <p>
            <strong>Asientos disponibles:</strong> {viaje.asientos}
          </p>
          {distanciaKm && (
            <>
              <p>
                <strong>Distancia:</strong> {distanciaKm} km
              </p>
              <p>
                <strong>Precio estimado:</strong> ${precio}
              </p>
            </>
          )}
        </div>

        <div className="dv-actions">
          <button onClick={onClose}>Volver</button>
          <button
            onClick={() => onReservar(viaje.id)}
            disabled={viaje.asientos <= 0}
          >
            {viaje.asientos > 0 ? "Confirmar Reserva" : "Sin asientos"}
          </button>
        </div>
      </div>
    </div>
  );
}
