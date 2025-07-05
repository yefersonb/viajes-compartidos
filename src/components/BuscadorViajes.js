// src/components/BuscadorViajes.js
import React, { useState } from "react";
import DetalleViaje from "./DetalleViaje";
import AutocompleteInput from "./AutocompleteInput";

/**
 * Componente BuscadorViajes
 * Props:
 * - viajes: Array de objetos { id, origen, destino, fecha (ISO), asientos, origenCoords, destinoCoords, horario }
 * - usuario: Objeto usuario con al menos uid, o null si no hay sesión
 * - onReservar: Función (viajeId) => Promise<void> que ejecuta la reserva
 */
export default function BuscadorViajes({ viajes, usuario, onReservar }) {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [resultados, setResultados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtrar viajes según criterios
  const buscar = () => {
    const dateISO = fecha ? new Date(fecha).toISOString().slice(0, 10) : null;
    const origText = typeof origen === 'object' ? origen.formatted_address : origen;
    const destText = typeof destino === 'object' ? destino.formatted_address : destino;
    const filt = viajes.filter(v => {
      const matchOrigen = origText ? v.origen.toLowerCase().includes(origText.toLowerCase()) : true;
      const matchDestino = destText ? v.destino.toLowerCase().includes(destText.toLowerCase()) : true;
      const matchFecha = dateISO ? v.fecha.slice(0, 10) === dateISO : true;
      const matchAsientos = v.asientos >= pasajeros;
      return matchOrigen && matchDestino && matchFecha && matchAsientos;
    });
    setResultados(filt);
  };

  // Confirmar reserva
  const confirmarReserva = async (viajeId) => {
    if (!usuario) {
      alert("Iniciá sesión para reservar");
      return;
    }
    if (typeof onReservar !== 'function') {
      console.error('onReservar no está definido');
      return;
    }
    setLoading(true);
    try {
      await onReservar(viajeId);
      alert('¡Reserva exitosa!');
      setDetalle(null);
      buscar(); // refresca resultados con nuevos asientos
    } catch (err) {
      console.error(err);
      alert('Hubo un problema al reservar');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar detalles si hay viaje seleccionado
  if (detalle) {
    return (
      <DetalleViaje
        viaje={detalle}
        pasajeros={pasajeros}
        onClose={() => setDetalle(null)}
        onReservar={() => confirmarReserva(detalle.id)}
        loading={loading}
      />
    );
  }

  return (
    <div className="buscador-viajes p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Buscar Viajes</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <AutocompleteInput
          placeholder="Origen"
          value={typeof origen === 'object' ? origen.formatted_address : origen}
          onChange={setOrigen}
          className="border p-2 rounded"
        />
        <AutocompleteInput
          placeholder="Destino"
          value={typeof destino === 'object' ? destino.formatted_address : destino}
          onChange={setDestino}
          className="border p-2 rounded"
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={pasajeros}
          onChange={e => setPasajeros(Number(e.target.value))}
        >
          {[...Array(6)].map((_, i) => (
            <option key={i+1} value={i+1}>{i+1} pasajero{ i>0 && 's' }</option>
          ))}
        </select>
      </div>

      <button
        onClick={buscar}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
      >Buscar</button>

      <div className="mt-6">
        {resultados.length === 0 ? (
          <p className="text-gray-600">No hay viajes disponibles.</p>
        ) : (
          resultados.map(v => (
            <div key={v.id} className="bg-white rounded-lg shadow p-4 mb-4">
              <p className="font-medium">{v.origen} → {v.destino}</p>
              <p className="text-sm">{new Date(v.fecha).toLocaleString()}</p>
              <p className="text-sm">Asientos: {v.asientos}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setDetalle(v)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >Ver detalles</button>
                <button
                  onClick={() => setDetalle(v)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >Reservar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
