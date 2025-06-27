export default function PantallaViajeros({ usuario }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl">¡Hola viajero {usuario.displayName}!</h2>
      {/* Aquí va la lista de viajes disponibles */}
    </div>
  );
}
