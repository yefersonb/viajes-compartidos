import React, { useEffect, useRef, useState } from "react";

function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);
  const [info, setInfo] = useState({ distancia: null, duracion: null, error: null });

  useEffect(() => {
    if (!origen || !destino) return;
    if (!window.google) {
      setInfo({ distancia: null, duracion: null, error: "Google Maps no está cargado." });
      return;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: -27.3671, lng: -55.8961 }, // Centro aproximado de Misiones
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#1976D2", strokeWeight: 5 }
    });

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const leg = result.routes[0].legs[0];
          setInfo({
            distancia: leg.distance.text,
            duracion: leg.duration.text,
            error: null,
          });
        } else {
          setInfo({
            distancia: null,
            duracion: null,
            error: "No se pudo calcular la ruta.",
          });
        }
      }
    );

    // Cleanup
    return () => {
      directionsRenderer.setMap(null);
    };
  }, [origen, destino]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "300px", marginBottom: "1rem", borderRadius: "10px" }}
      />
      {info.error && <div style={{ color: "red" }}>{info.error}</div>}
      {info.distancia && info.duracion && (
        <div>
          <strong>Distancia:</strong> {info.distancia} <br />
          <strong>Duración estimada:</strong> {info.duracion}
        </div>
      )}
      {!info.error && !info.distancia && <span>Cargando ruta...</span>}
    </div>
  );
}

export default MapaRuta;