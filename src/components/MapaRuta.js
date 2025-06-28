import React, { useEffect, useRef, useState } from "react";

export default function MapaRuta({ origen, destino }) {
  const mapRef = useRef(null);
  const [distancia, setDistancia] = useState("");
  const [duracion, setDuracion] = useState("");
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  // TU API KEY
  const API_KEY = "AIzaSyCWrPZ9Y..."; // pon tu key aquí

  // Geocodifica una dirección a lat/lng usando Geocoding API
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
    // Carga el mapa básico
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`;
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
        // 1. Geocodificar origen y destino
        const [origCoord, destCoord] = await Promise.all([
          geocode(origen),
          geocode(destino)
        ]);

        // 2. Llamar a la Routes API REST
        const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`;
        const body = {
          "origin": { "location": { "latLng": origCoord } },
          "destination": { "location": { "latLng": destCoord } },
          "travelMode": "DRIVE",
          "routingPreference": "TRAFFIC_AWARE"
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
              ? convertirDuracion(leg.duration)
              : "N/D"
          );

          // Mostrar ruta en el mapa (polilínea)
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 7,
            center: origCoord,
          });

          // Decodifica la polilínea (requiere geometry library)
          if (
            data.routes[0].polyline &&
            data.routes[0].polyline.encodedPolyline &&
            window.google.maps.geometry
          ) {
            const routePath =
              window.google.maps.geometry.encoding.decodePath(
                data.routes[0].polyline.encodedPolyline
              );
            const routeLine = new window.google.maps.Polyline({
              path: routePath,
              geodesic: true,
              strokeColor: "#4285F4",
              strokeOpacity: 1.0,
              strokeWeight: 4,
            });
            routeLine.setMap(map);

            // Ajust