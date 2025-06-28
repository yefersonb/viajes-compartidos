import React, { useEffect, useState } from "react";

const API_KEY = "TU_API_KEY"; // Cambia esto por tu API KEY real

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK") {
    return {
      latitude: data.results[0].geometry.location.lat,
      longitude: data.results[0].geometry.location.lng,
    };
  } else {
    throw new Error("No se pudo geocodificar: " + address);
  }
}

function MapaRuta({ origen, destino }) {
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRoute() {
      try {
        const [origCoord, destCoord] = await Promise.all([
          geocode(origen),
          geocode(destino)
        ]);

        const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`;
        const body = {
          origin: { location: { latLng: origCoord } },
          destination: { location: { latLng: destCoord } },
          travelMode: "DRIVE"
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          throw new Error("Error al obtener la ruta");
        }

        const rutaData = await res.json();
        setRuta(rutaData);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    if (origen && destino) {
      fetchRoute();
    }
  }, [origen, destino]);

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {ruta && <pre>{JSON.stringify(ruta, null, 2)}</pre>}
      {!ruta && !error && <span>Cargando ruta...</span>}
    </div>
  );
}

export default MapaRuta;