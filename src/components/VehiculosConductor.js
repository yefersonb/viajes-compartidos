// src/components/VehiculosConductor.js
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { db, storage } from "../firebase";
import { collection, addDoc, getDocs, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function VehiculosConductor() {
  const { usuario } = useUser();
  const [vehiculos, setVehiculos] = useState([]);
  // Form state
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [color, setColor] = useState("");
  const [patente, setPatente] = useState("");
  const [asientos, setAsientos] = useState(4);
  const [imagenFile, setImagenFile] = useState(null);
  const [cedulaFile, setCedulaFile] = useState(null);
  const [seguroFile, setSeguroFile] = useState(null);
  const [vtvFile, setVtvFile] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const q = collection(db, "usuarios", usuario.uid, "vehiculos");
      const snap = await getDocs(q);
      setVehiculos(snap.docs.map(d => ({ id: d.id, ...d.data() })));  
    })();
  }, [usuario]);

  const uploadDoc = async (file, folder, id) => {
    if (!file) return null;
    const path = `${usuario.uid}/${folder}/${id}/${file.name}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
  };

  const agregarVehiculo = async () => {
    if (!marca || !modelo || !anio || !color || !patente) {
      alert("Completa todos los datos del vehículo.");
      return;
    }
    try {
      const vehRef = await addDoc(
        collection(db, "usuarios", usuario.uid, "vehiculos"),
        { marca, modelo, anio, color, patente, asientos, fechaAlta: new Date() }
      );
      const id = vehRef.id;
      const updates = {};
      const urls = await Promise.all([
        uploadDoc(imagenFile, "imagen", id),
        uploadDoc(cedulaFile, "cedula", id),
        uploadDoc(seguroFile, "seguro", id),
        uploadDoc(vtvFile, "vtv", id),
      ]);
      const [urlImg, urlCed, urlSeg, urlVtv] = urls;
      if (urlImg) updates.imagenURL = urlImg;
      if (urlCed) updates.cedulaURL = urlCed;
      if (urlSeg) updates.seguroURL = urlSeg;
      if (urlVtv) updates.vtvURL = urlVtv;
      if (Object.keys(updates).length) await updateDoc(vehRef, updates);
    } catch (error) {
      console.error("Error añadiendo vehículo:", error);
      alert("No se pudo agregar el vehículo.");
    }
    setMarca(""); setModelo(""); setAnio(""); setColor(""); setPatente(""); setAsientos(4);
    setImagenFile(null); setCedulaFile(null); setSeguroFile(null); setVtvFile(null);
    const snap = await getDocs(collection(db, "usuarios", usuario.uid, "vehiculos"));
    setVehiculos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600 }}>🚗 Mis Vehículos</h3>
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, fontWeight: 500 }}>Agregar Nuevo Vehículo</h4>
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left: datos y docs */}
          <div style={{ flex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
              <input placeholder="Marca" value={marca} onChange={e => setMarca(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Año" value={anio} onChange={e => setAnio(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Color" value={color} onChange={e => setColor(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Patente" value={patente} onChange={e => setPatente(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <input type="number" placeholder="Asientos" min={1} value={asientos} onChange={e => setAsientos(+e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Cédula de automotor
                <input type="file" accept="image/*,application/pdf" onChange={e => setCedulaFile(e.target.files[0])} style={{ display: 'block', marginTop: 4 }} />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Seguro
                <input type="file" accept="image/*,application/pdf" onChange={e => setSeguroFile(e.target.files[0])} style={{ display: 'block', marginTop: 4 }} />
              </label>
              <label style={{ display: 'block', marginBottom: 8 }}>
                VTV
                <input type="file" accept="image/*,application/pdf" onChange={e => setVtvFile(e.target.files[0])} style={{ display: 'block', marginTop: 4 }} />
              </label>
            </div>
            <button onClick={agregarVehiculo} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer', marginTop: 16 }}>Guardar vehículo</button>
          </div>
          {/* Right: foto */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Foto del vehículo
              <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} style={{ display: 'block', marginTop: 4 }} />
            </label>
            {imagenFile && (
              <img src={URL.createObjectURL(imagenFile)} alt="Preview" style={{ width: '100%', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            )}
          </div>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vehiculos.map(v => (
          <li key={v.id} style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            {v.imagenURL && <img src={v.imagenURL} alt="Vehículo" style={{ width: 200, borderRadius: 4, objectFit: 'cover' }} />}
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <p><strong>Marca:</strong> {v.marca}</p>
              <p><strong>Modelo:</strong> {v.modelo}</p>
              <p><strong>Año:</strong> {v.anio}</p>
              <p><strong>Color:</strong> {v.color}</p>
              <p><strong>Patente:</strong> {v.patente}</p>
              <p><strong>Asientos:</strong> {v.asientos}</p>
              {v.cedulaURL && <p><a href={v.cedulaURL} target="_blank" rel="noreferrer">Ver Cédula</a></p>}
              {v.seguroURL && <p><a href={v.seguroURL} target="_blank" rel="noreferrer">Ver Seguro</a></p>}
              {v.vtvURL && <p><a href={v.vtvURL} target="_blank" rel="noreferrer">Ver VTV</a></p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
