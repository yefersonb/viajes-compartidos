import React from "react";

/**
 * ToDo: This...? This needs a LOT of work.
 * 
 * Barra de acciones Editar/Guardar/Cancelar, separada y fija en desktop.
 * Props:
 * - editMode, onEdit, onSave, onCancel, guardado
 */
export default function ActionBar({
  editMode,
  onEdit,
  onSave,
  onCancel,
  guardado,
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "var(--bg)",
        borderBottom: "1px solid #e2e8f0",
        padding: "1rem 0 0.5rem 0",
        marginBottom: 16,
      }}
    >
      {!editMode ? (
        <button
          onClick={onEdit}
          style={{
            padding: "7px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 1px 6px #2563eb11",
            transition: "background 0.18s",
          }}
        >
          Editar
        </button>
      ) : (
        <>
          <button
            onClick={onSave}
            style={{
              padding: "7px 18px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 1px 6px #05966911",
              transition: "background 0.18s",
            }}
          >
            {guardado ? "Guardado!" : "Guardar"}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 18px",
              background: "#64748b",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 1px 6px #64748b11",
              transition: "background 0.18s",
            }}
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}