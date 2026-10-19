// Pantallas privadas, con los roles que pueden entrar. La usan el menú lateral
// (muestra solo las del rol) y App.jsx (RequireRol), así la regla está escrita una sola vez.
// `roles` sigue la jerarquía de auth/permisos.js: el ADMINISTRADOR entra a lo de RECEPCIONISTA y ORGANIZADOR.
// `icono` es el path de un SVG de 24x24 (trazo).
export const PANTALLAS = {
  torneos: {
    ruta: '/portal/torneos',
    texto: 'Torneos',
    roles: ['JUGADOR'],
    icono: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z',
  },
  ranking: {
    ruta: '/portal/ranking',
    texto: 'Ranking',
    roles: ['JUGADOR', 'RECEPCIONISTA', 'ORGANIZADOR'],
    icono: 'M18 20V10M12 20V4M6 20v-6',
  },
  inscripciones: {
    ruta: '/gestion/inscripciones',
    texto: 'Inscripciones',
    roles: ['RECEPCIONISTA', 'ORGANIZADOR'],
    icono: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM9 14l2 2 4-4',
  },
  gestionTorneos: {
    ruta: '/gestion/torneos',
    texto: 'Torneos y Ligas',
    roles: ['ORGANIZADOR'],
    icono: 'M3 5h18M3 12h18M3 19h18',
  },
  usuarios: {
    ruta: '/admin/usuarios',
    texto: 'Usuarios',
    roles: ['ADMINISTRADOR'],
    icono: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  perfil: {
    ruta: '/perfil',
    texto: 'Mi cuenta',
    roles: ['JUGADOR', 'RECEPCIONISTA', 'ORGANIZADOR', 'ADMINISTRADOR'],
    icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
}

// Orden del menú lateral
export const ORDEN_MENU = ['torneos', 'ranking', 'inscripciones', 'gestionTorneos', 'usuarios', 'perfil']

// Texto del breadcrumb del header según la ruta. Las pantallas del menú muestran su nombre.
export const migasDe = (pathname) => {
  if (pathname.startsWith(`${PANTALLAS.torneos.ruta}/`)) return [PANTALLAS.torneos.texto, 'Detalle del torneo']
  if (/^\/portal\/torneos\/[^/]+\/inscripcion$/.test(pathname)) return [PANTALLAS.torneos.texto, 'Inscripción']
  if (pathname === PANTALLAS.perfil.ruta) return ['Mi cuenta', 'Mi perfil']
  if (pathname === `${PANTALLAS.perfil.ruta}/editar`) return ['Mi cuenta', 'Mi perfil', 'Editar datos']
  if (pathname === `${PANTALLAS.usuarios.ruta}/nuevo`) return ['Usuarios', 'Crear cuenta de personal']
  if (pathname.startsWith(`${PANTALLAS.usuarios.ruta}/`)) return ['Usuarios', 'Detalle de usuario']
  if (pathname === `${PANTALLAS.gestionTorneos.ruta}/nuevo`) return [PANTALLAS.gestionTorneos.texto, 'Nuevo evento']
  if (/^\/gestion\/torneos\/[^/]+\/editar$/.test(pathname)) return [PANTALLAS.gestionTorneos.texto, 'Editar evento']
  if (pathname.startsWith(`${PANTALLAS.gestionTorneos.ruta}/`)) return [PANTALLAS.gestionTorneos.texto, 'Detalle del torneo']
  const pantalla = Object.values(PANTALLAS).find((p) => p.ruta === pathname)
  return pantalla ? [pantalla.texto] : []
}