import React, { useEffect, useRef, useState } from "react";

export default function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);
  const [distancia, setDistancia] = useState("");
  const [duracion, setDuracion] = useState("");
  const [error, setError] = useState("");

  // NUEVA API KEY
  const API_KEY = "AIzaSyCJ0WA7v-rvHZIU4VXFnDyBGoo_XTxtYTE";

  // Geocoding auxiliar
  async function geocode(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK") {
      // Corrige: la API devuelve lat, lng pero la Routes API quiere latitude, longitude
      return {
        latitude: data.results[0].geometry.location.lat,
        longitude: data.results[0].geometry.location.lng,
      };
    } else {
      throw new Error("No se pudo geocodificar: " + address);
    }
  }

  useEffect(() => {
    if (!origen || !destino) return;

    const calcularRuta = async () => {
      try {
        // Espera a que window.google esté disponible (si el usuario recarga muy rápido)
        if (!window.google || !window.google.maps || !window.google.maps.geometry) {
          setTimeout(calcularRuta, 500);
          return;
        }

        const [origCoord, destCoord] = await Promise.all([
          geocode(origen),
          geocode(destino)
        ]);

        // Llamada REST a Routes API -- OJO: latitude/longitude en vez de lat/lng
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
            center: { lat: origCoord.latitude, lng: origCoord.longitude },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen, destino]);

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