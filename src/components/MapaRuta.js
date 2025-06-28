import React, { useEffect, useRef, useState } from "react";

export default function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);
  const [distancia, setDistancia] = useState("");
  const [duracion, setDuracion] = useState("");
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  // TU API KEY AQUI
  const API_KEY = "AIzaSyCWrPZ9Y5tq-IOH3gO8HMUxIeqEKj24T2M";

  // Geocoding auxiliar
  async function geocode(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK") {
      return data.results[0].geometry.location;
    } else {
      throw new Error("No se pudo geocodificar: " + address);
    }
  }

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
      return;
    }
    setMapLoaded(true);
  }, [API_KEY]);

  useEffect(() => {
    if (!mapLoaded || !origen || !destino) return;

    const calcularRuta = async () => {
      try {
        const [origCoord, destCoord] = await Promise.all([
          geocode(origen),
          geocode(destino)
        ]);

        // Llamada REST a Routes API
        const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`;
        const body = {
          origin: { location: { latLng: origCoord } },
          destination: { location: { latLng: destCoord } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE"
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const leg = data.routes[0].legs[0];
          setDistancia(
            leg.distanceMeters
              ? (leg.distanceMeters / 1000).toFixed(1) + " km"
              : "N/D"
          );
          setDuracion(
            leg.duration
              ? (parseInt(leg.duration.replace("s", "")) / 60).toFixed(0) + " min"
              : "N/D"
          );

          // Mostrar ruta en el mapa (polyline)
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 7,
            center: origCoord,
          });

          if (
            data.routes[0].polyline &&
            data.routes[0].polyline.encodedPolyline
          ) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(
              data.routes[0].polyline.encodedPolyline
            );
            const routeLine = new window.google.maps.Polyline({
              path: decodedPath,
              geodesic: true,
              strokeColor: "#4285F4",
              strokeOpacity: 1.0,
              strokeWeight: 4,
            });
            routeLine.setMap(map);

            // Ajusta el mapa al recorrido
            const bounds = new window.google.maps.LatLngBounds();
            decodedPath.forEach((latLng) => bounds.extend(latLng));
            map.fitBounds(bounds);
          }
          setError("");
        } else {
          setError("No se encontró una ruta disponible.");
          setDistancia("");
          setDuracion("");
        }
      } catch (err) {
        setError("Error calculando la ruta: " + err.message);
        setDistancia("");
        setDuracion("");
      }
    };

    calcularRuta();
  }, [mapLoaded, origen, destino, API_KEY]);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "200px", marginBottom: 8, borderRadius: 8 }} />
      <div>
        <b>Distancia:</b> {distancia || "No disponible"}<br />
        <b>Duración estimada:</b> {duracion || "No disponible"}
      </div>
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}