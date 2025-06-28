// ...tus imports...
export default function BuscadorViajes() {
  // ... tus useState ...
  console.log("mostrarMapa:", mostrarMapa);

  // ...buscarViajes y reservarViaje...

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
      <h2>Buscar Viajes</h2>
      {/* ...inputs... */}
      <ul className="viajes-list">
        {viajes.map((v) => (
          <li key={v.id} style={{ marginBottom: "2rem", background: "#eef4fb", borderRadius: "10px", padding: "1rem" }}>
            <strong>
              {v.origen} → {v.destino}
            </strong>
            {/* ...resto de los datos... */}
            <button
              // ...estilos...
              onClick={() => reservarViaje(v.id)}
            >
              Reservar
            </button>
            {mostrarMapa[v.id] && (
              <div style={{ marginTop: "1rem" }}>
                {console.log("Montando MapaRuta para", v.origen, v.destino)}
                <MapaRuta origen={v.origen} destino={v.destino} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}