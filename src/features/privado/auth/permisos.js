// Misma jerarquía que el backend (autorizar en viper-api): el ADMINISTRADOR puede todo lo de
// RECEPCIONISTA y ORGANIZADOR, pero no lo exclusivo de JUGADOR (no tiene perfil de jugador).
const PERMISOS_DE = {
  ADMINISTRADOR: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ORGANIZADOR'],
  RECEPCIONISTA: ['RECEPCIONISTA'],
  ORGANIZADOR: ['ORGANIZADOR'],
  JUGADOR: ['JUGADOR'],
}

// tienePermiso('ADMINISTRADOR', ['ORGANIZADOR']) → true · tienePermiso('ADMINISTRADOR', ['JUGADOR']) → false
export const tienePermiso = (rol, rolesPermitidos) =>
  (PERMISOS_DE[rol] ?? []).some((permiso) => rolesPermitidos.includes(permiso))

export const ETIQUETA_ROL = {
  ADMINISTRADOR: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  ORGANIZADOR: 'Organizador',
  JUGADOR: 'Jugador',
}