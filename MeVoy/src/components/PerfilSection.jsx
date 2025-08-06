// src/components/PerfilSection.jsx
import React, { useEffect, useState, useCallback } from 'react';
import InputField from './InputField';
import Badge from './Badge';
import RatingRow from './RatingRow';
import ActionBar from './ActionBar';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const colors = {
  primary: '#2563eb',
  accentBg: '#fff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#555',
  lightBg: '#f8f9fb',
};

const PerfilSection = ({
  usuario,
  perfil,
  loading,
  error,
  editMode,
  guardado,
  onEdit,
  onSave,
  onCancel,
  onPerfilChange,
  onPhotoSelected,
  preview,
  uploading,
}) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);

  const completadosPercent = perfil.viajesPublicados
    ? Math.round((perfil.viajesCompletados / perfil.viajesPublicados) * 100)
    : 0;

  const valoraciones = perfil.valoraciones || {
    conduccion: 0,
    puntualidad: 0,
    amabilidad: 0,
    limpieza: 0,
  };

  const loadVehiculos = useCallback(async () => {
    setLoadingVehiculos(true);
    setVehiculos([]);
    if (!auth.currentUser) {
      setLoadingVehiculos(false);
      return;
    }
    try {
      const vehiculosRef = collection(
        db,
        'usuarios',
        auth.currentUser.uid,
        'vehiculos'
      );
      const snap = await getDocs(vehiculosRef);
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVehiculos(lista);
    } catch (e) {
      console.error('Error cargando vehículos en perfil:', e);
    } finally {
      setLoadingVehiculos(false);
    }
  }, []);

  useEffect(() => {
    loadVehiculos();
  }, [loadVehiculos]);

  if (loading) return <LoadingSpinner size="md" text="Cargando perfil..." />;
  if (error) return <ErrorMessage error={error} />;

  const avatarSrc = preview || perfil.fotoURL || usuario?.photoURL || null;

  return (
    <section>
      <h1 className="text-2xl font-bold mb-6">Perfil</h1>

      <ActionBar
        editMode={editMode}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        guardado={guardado}
      />

      <div className="flex gap-6 items-start flex-wrap mb-6">
        <div
          className="relative"
          style={{ width: 98, height: 98, minWidth: 98, minHeight: 98 }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#f0f4f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Foto de perfil"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div className="text-xs text-gray-500">Sin foto</div>
            )}

            {uploading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {editMode && (
            <label
              style={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                background: '#fff',
                borderRadius: '50%',
                padding: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto"
            >
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoSelected}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: 14, lineHeight: 1 }}>✎</div>
            </label>
          )}
        </div>

        <div className="flex-1 min-w-56">
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-2xl font-bold">
              {perfil.nombre || usuario?.displayName || 'Sin nombre'}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="verificado">Conductor verificado</Badge>
              <Badge variant="viajes">
                {completadosPercent === 100
                  ? '100% viajes completados'
                  : `${completadosPercent}% viajes`}
              </Badge>
              <Badge variant="rapido">Responde rápido</Badge>
            </div>
          </div>
          <div className="text-xs mt-1 text-gray-600">
            Último viaje: {perfil.ultimoViaje} • Tasa de respuesta:{' '}
            {Math.round((perfil.tasaRespuesta || 0) * 100)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="WhatsApp"
          type="text"
          value={perfil.whatsapp || ''}
          onChange={(e) => onPerfilChange('whatsapp', e.target.value)}
          readOnly={!editMode}
          placeholder="Sin datos"
        />
        <InputField
          label="Fecha de nacimiento"
          type="date"
          value={perfil.fechaNacimiento || ''}
          onChange={(e) => onPerfilChange('fechaNacimiento', e.target.value)}
          readOnly={!editMode}
          placeholder="Sin datos"
        />

        <div className="md:col-span-2">
          <InputField
            label="Acerca de mí"
            type="textarea"
            value={perfil.descripcion || ''}
            onChange={(e) => onPerfilChange('descripcion', e.target.value)}
            readOnly={!editMode}
            placeholder="Sin datos"
          />
        </div>

        {/* Valoraciones en recuadro */}
        <div className="md:col-span-2 mt-6">
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 16,
              background: colors.accentBg,
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
              Valoraciones
            </div>
            <div
              style={{
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 140 }}>
                <RatingRow label="Conducción" value={valoraciones.conduccion} />
                <RatingRow label="Puntualidad" value={valoraciones.puntualidad} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <RatingRow label="Amabilidad" value={valoraciones.amabilidad} />
                <RatingRow label="Limpieza" value={valoraciones.limpieza} />
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#555',
                marginTop: 4,
              }}
            >
              {perfil.viajesCompletados} viajes completados • {completadosPercent}%
              éxito
            </div>
          </div>
        </div>

        {/* Vehículos existentes (no editable aquí) */}
        <div className="md:col-span-2 mt-8">
          <div className="font-semibold mb-1.5">Vehículos cargados</div>
          {loadingVehiculos ? (
            <div className="text-gray-600">Cargando vehículos...</div>
          ) : vehiculos.length === 0 ? (
            <div className="text-sm text-red-600">
              No tenés vehículos cargados. Agregá uno en la pestaña{' '}
              <strong>Vehículos</strong>.
            </div>
          ) : vehiculos.length === 1 ? (
            <div className="text-sm">
              {vehiculos[0].modelo || 'Sin modelo'}{' '}
              {vehiculos[0].patente ? `- ${vehiculos[0].patente}` : ''}
            </div>
          ) : (
            <ul className="text-sm list-disc ml-5">
              {vehiculos.map((v) => (
                <li key={v.id}>
                  {v.modelo || 'Sin modelo'} {v.patente ? `- ${v.patente}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default PerfilSection;
