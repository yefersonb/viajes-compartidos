```mermaid
flowchart TD
  A[Inicio / Home] --> B{Seleccionar Rol}
  B -->|Conductor| C{¿Vehículo Registrado?}
  C -->|No| D[Nuevo Vehículo]
  C -->|Sí| E[Mis Vehículos]
  D --> E
  E --> F[Perfil Conductor]
  F --> G{¿Publicar o Ver Viajes?}
  G -->|Publicar| H[Nuevo Viaje]
  G -->|Ver| I[Mis Viajes Conductor]
  H --> I
  I --> L[Post-viaje: Calificar & Historial]
  B -->|Pasajero| J[Buscador de Viajes]
  J --> K{¿Hay Viajes Disponibles?}
  K -->|Sí| M[Seleccionar y Reservar]
  K -->|No| N[Mostrar “Sin Viajes”]
  M --> O[Confirmación de Reserva]
  O --> L
