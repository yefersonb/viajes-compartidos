// src/components/PerfilConductorV2Enhanced.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { usePerfilData } from "../hooks/usePerfilData";
import { useViajesData } from "../hooks/useViajesData";
import { useResponsive } from "../hooks/useResponsive";
import usePhotoUpload from "../hooks/usePhotoUpload";
import TabNavigation from "./TabNavigation";
import PerfilSection from "./PerfilSection";
import ViajesSection from "./ViajesSection";
import VehiculosConductor from "./VehiculosConductor";
import NuevoViaje from "./NuevoViaje";

// 👇 NUEVO
import EnviosDelViaje from "./EnviosDelViaje";
import EnviosDisponibles from "./EnviosDisponibles";

// 👇 NUEVO: agregamos "Envíos"
const menuItems = ["Perfil", "Vehículos", "Reservas", "Envíos", "Nuevo Viaje"];

export default function PerfilConductorV2Enhanced({
  viajes: viajesProp,
  reservas: reservasProp,
}) {
  // ===== HOOKS Y ESTADO =====
  const { usuario } = useUser();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState(menuItems[0]);
  const [editMode, setEditMode] = useState(false);

  // Hook para datos del perfil
  const {
    perfil,
    loading: loadingPerfil,
    error: errorPerfil,
    guardado,
    updatePerfil,
    savePerfil,
    cancelEdit,
  } = usePerfilData(usuario);

  // Hook para datos de viajes
  const {
    viajesPublicados,
    reservasRecibidas,
    loading: loadingViajes,
    error: errorViajes,
    loadViajesYReservas,
    eliminarViaje,
  } = useViajesData(usuario);

  // Carga inicial de viajes y reservas
  useEffect(() => {
    if (usuario) {
      loadViajesYReservas();
    }
    // eslint-disable-next-line
  }, [usuario]);

  // Hook para subida de fotos
  const { preview, uploading, handlePhotoSelected } = usePhotoUpload(
    usuario?.uid || ""
  );

  // ===== HANDLERS =====
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditMode(false);
  };

  const handleCreateTrip = () => {
    setActiveTab("Nuevo Viaje");
  };

  const handleSave = async () => {
    try {
      await savePerfil();
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = () => {
    cancelEdit();
    setEditMode(false);
  };

  const onPhotoSelected = async (e) => {
    const url = await handlePhotoSelected(e);
    if (url) {
      updatePerfil("fotoURL", url);
      if (usuario) {
        await savePerfil();
      }
    }
  };

  // ===== RENDER CONDICIONAL DE CONTENIDO =====
  const renderTabContent = () => {
    switch (activeTab) {
      case "Perfil":
        return (
          <PerfilSection
            perfil={perfil}
            loading={loadingPerfil}
            error={errorPerfil}
            editMode={editMode}
            guardado={guardado}
            onEdit={() => setEditMode(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onPerfilChange={updatePerfil}
            onPhotoSelected={onPhotoSelected}
            preview={preview}
            uploading={uploading}
          />
        );

      case "Vehículos":
        return (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden section-card">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">
                  🚗
                </span>
                Mis Vehículos
              </h1>
              <p className="text-blue-100 mt-1">Gestiona tus vehículos registrados</p>
            </div>
            <div className="p-6">
              <VehiculosConductor viajes={viajesProp} reservas={reservasProp} />
            </div>
          </section>
        );

      case "Reservas":
        return (
          <ViajesSection
            viajesPublicados={viajesPublicados}
            reservasRecibidas={reservasRecibidas}
            loading={loadingViajes}
            error={errorViajes}
            onLoadData={loadViajesYReservas}
            onEliminarViaje={eliminarViaje}
          />
        );

      // 👇 Envíos para el CONDUCTOR (agregamos “disponibles” sin romper nada)
      case "Envíos":
        return (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden section-card">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">
                  📦
                </span>
                Envíos de Paquetes
              </h1>
              <p className="text-indigo-100 mt-1">
                Aceptá solicitudes, iniciá retiros y confirmá entregas con PIN.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Bloque 1: Envíos disponibles para aceptar */}
              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Envíos disponibles</h3>
                  <span className="text-xs text-gray-500">Conductor</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Mirá los envíos públicos y aceptá los que te sirvan.
                </p>
                <div className="mt-3">
                  <EnviosDisponibles />
                </div>
              </div>

              {/* Bloque 2: Envíos vinculados a tus viajes (lo que ya tenías) */}
              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Vinculados a tus viajes</h3>
                  <button
                    type="button"
                    onClick={loadViajesYReservas}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Refrescar
                  </button>
                </div>

                <div className="mt-3">
                  <EnviosDelViaje
                    conductorId={usuario?.uid}
                    viajesPublicados={viajesPublicados}
                    onRefrescar={loadViajesYReservas}
                  />
                </div>
              </div>
            </div>
          </section>
        );

      case "Nuevo Viaje":
        return (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden section-card">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <p className="text-green-100 mt-1 font-bold">
                <strong>Publica tu próximo viaje y encuentra pasajeros</strong>
              </p>
            </div>
            <div className="p-6">
              <NuevoViaje />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // ===== RENDER PRINCIPAL =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          menuItems={menuItems}
          onCreateTrip={handleCreateTrip}
          userRole={usuario?.rol}
        />
      </div>

      {/* Contenido principal */}
      <main
        className={`
          max-w-4xl mx-auto py-8 
          ${isMobile ? "px-4" : "px-6"} 
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">
              Panel
            </span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{activeTab}</span>
          </div>
        </nav>

        {/* Contenido de la pestaña activa */}
        <div className="transition-opacity duration-300 ease-in-out opacity-100">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer opcional */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto py-6 px-4 text-center text-gray-500 text-sm">
          <p>© 2024 Tu Plataforma de Viajes Compartidos</p>
        </div>
      </footer>
    </div>
  );
}
