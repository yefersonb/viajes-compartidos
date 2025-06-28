import React, { useEffect, useRef, useState } from "react";

export default function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);
  const [distancia, setDistancia] = useState("");
  const [duracion, setDuracion] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  // Poné tu API Key aquí
  const API_KEY = "AIzaSyA5Ff5D5b1iUJQ4E-K9H6F_vMpwJ1p0Fsw";

  useEffect(() => {
    if (!origen || !destino) return;

    // Carga Google Maps JS API si no está cargada
    if (!window.google) {
      const script = document.createElement("script");
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
      return;
    }
    setMapLoaded(true);
  }, [origen, destino, API_KEY]);

  useEffect(() => {
    if (!mapLoaded || !origen || !destino) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: -27.3621, lng: -55.9009 }, // Centro aproximado en Misiones
    });

    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: origen,
        destination: destino,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);

          // Distancia y duración
          const leg = result.routes[0].legs[0];
          setDistancia(leg.distance.text);
          setDuracion(leg.duration.text);
        } else {
          setDistancia("No disponible");
          setDuracion("No disponible");
        }
      }
    );

    // Limpia el mapa al desmontar
    return () => {
      directionsRenderer.setMap(null);
    };
  }, [mapLoaded, origen, destino]);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "200px", marginBottom: 8, borderRadius: 8 }} />
      <div>
        <b>Distancia:</b> {distancia} <br />
        <b>Duración estimada:</b> {duracion}
      </div>
    </div>
  );
}