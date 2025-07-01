// src/components/AutocompleteInput.js
import React, { useRef, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { MAP_LIBS, MAP_LOADER_ID } from "../googleMapsConfig"; // ← constantes globales

export default function AutocompleteInput({ placeholder, value, onChange }) {
  // Cargamos SIEMPRE con el mismo id y el mismo array de librerías
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAP_LOADER_ID,
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBS,
  });

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null); // guardamos la instancia para no recrearla

  useEffect(() => {
    if (
      isLoaded &&
      !loadError &&
      inputRef.current &&
      !autocompleteRef.current
    ) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { types: ["geocode"] }
      );

      autocompleteRef.current.setFields(["formatted_address", "geometry"]);

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.formatted_address) {
          onChange(place); // devolvemos el objeto place completo (ajustalo si solo querés la dirección)
        }
      });
    }
  }, [isLoaded, loadError, onChange]);

  if (loadError) return <p>Error cargando Autocomplete</p>;
  if (!isLoaded) return <p>Cargando Autocomplete…</p>;

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: 8, margin: "8px 0" }}
    />
  );
}
