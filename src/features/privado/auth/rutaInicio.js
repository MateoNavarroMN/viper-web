import { PANTALLAS } from '../layout/navegacion'
import { tienePermiso } from './permisos'

// Panel al que va cada rol después de iniciar sesión (Anexo C del plan)
const PANEL_POR_ROL = {
  JUGADOR: '/portal/torneos',
  RECEPCIONISTA: '/gestion/inscripciones',
  ORGANIZADOR: '/gestion/torneos',
  ADMINISTRADOR: '/admin/usuarios',
}

export const rutaInicio = (rol) => PANEL_POR_ROL[rol] ?? '/'

// ¿Puede este rol abrir esa ruta privada? Sigue las mismas reglas que App.jsx (PANTALLAS y «Archivar», solo del Administrador)
export const rutaPermitida = (pathname, rol) => {
  if (/^\/gestion\/torneos\/[^/]+\/archivar$/.test(pathname)) return rol === 'ADMINISTRADOR'
  const pantalla = Object.values(PANTALLAS).find((p) => pathname === p.ruta || pathname.startsWith(`${p.ruta}/`))
  return Boolean(pantalla) && tienePermiso(rol, pantalla.roles)
}

// Después de iniciar sesión se vuelve a la pantalla que se quería abrir solo si este rol puede verla. Si no (por ejemplo, la
// sesión de otro rol venció en esa pantalla y ahora entra una cuenta distinta), va al panel de su rol y no a «Sin permiso».
export const destinoDespuesDeIngresar = (rol, desde) => (desde && rutaPermitida(desde, rol) ? desde : rutaInicio(rol))

// Rutas que exigen sesión: ahí un cambio de cuenta puede dejar al usuario en una pantalla que no es de su rol
export const esRutaPrivada = (pathname) => /^\/(portal|gestion|admin)(\/|$)/.test(pathname)