// ...otros imports y código
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

// ...

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