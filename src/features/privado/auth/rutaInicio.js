// Panel al que va cada rol después de iniciar sesión (Anexo C del plan)
const PANEL_POR_ROL = {
  JUGADOR: '/portal/torneos',
  RECEPCIONISTA: '/gestion/inscripciones',
  ORGANIZADOR: '/gestion/torneos',
  ADMINISTRADOR: '/admin/usuarios',
}

export const rutaInicio = (rol) => PANEL_POR_ROL[rol] ?? '/'