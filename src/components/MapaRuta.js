import React, { useEffect, useRef } from "react";

function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!origen || !destino || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: -27.36, lng: -55.9 }, // centro aproximado Misiones
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: origen,
        destination: destino,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const route = result.routes[0].legs[0];
          console.log(`Distancia: ${route.distance.text}`);
          console.log(`Duración: ${route.duration.text}`);
        } else {
          console.error("Error en la ruta:", status);
        }
      }
    );
  }, [origen, destino]);

  return (
    <div>
      <h4>Ruta entre {origen} y {destino}</h4>
      <div ref={mapRef} style={{ height: "400px", width: "100%", marginTop: "10px" }} />
    </div>
  );
}

export default MapaRuta;
