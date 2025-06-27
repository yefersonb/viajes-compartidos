import React, { useRef, useEffect } from "react";

function AutocompleteInput({ value, onChange, placeholder }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"], // también podés probar ["(cities)"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const direccion = place.formatted_address || place.name;
      if (direccion) onChange(direccion);
    });
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      defaultValue={value}
      className="border p-2 m-2 w-full"
    />
  );
}

export default AutocompleteInput;
