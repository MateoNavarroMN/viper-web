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
    icono: 'M5 21v-6 M12 21v-4 M19 21v-10 M2 16l5-5 5 5 9-9 M16 7h5v5',
  },
  inscripciones: {
    ruta: '/gestion/inscripciones',
    texto: 'Inscripciones',
    roles: ['RECEPCIONISTA', 'ORGANIZADOR'],
    icono: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM9 14l2 2 4-4',
  },
  calendario: {
    ruta: '/gestion/calendario',
    texto: 'Calendario',
    roles: ['RECEPCIONISTA', 'ORGANIZADOR'],
    icono: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  },
  socios: {
    ruta: '/gestion/socios',
    texto: 'Socios y cuotas',
    roles: ['RECEPCIONISTA'],
    icono: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M5 16c0-1.7 1.5-3 3-3s3 1.3 3 3 M14 9h5 M14 13h5',
  },
  reglasPuntuacion: {
    ruta: '/gestion/reglas-puntuacion',
    texto: 'Reglas de puntuación',
    roles: ['ORGANIZADOR'],
    icono: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  },
  reservas: {
    ruta: '/portal/reservas',
    texto: 'Reservas',
    roles: ['JUGADOR'],
    icono: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M12 5v14 M2 12h20',
  },
  reservasClub: {
    ruta: '/gestion/reservas',
    texto: 'Reservas',
    roles: ['RECEPCIONISTA'],
    icono: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M12 5v14 M2 12h20',
  },
  alquileresFijos: {
    ruta: '/gestion/alquileres-fijos',
    texto: 'Alquileres fijos',
    roles: ['RECEPCIONISTA'],
    icono: 'M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3',
  },
  gestionTorneos: {
    ruta: '/gestion/torneos',
    texto: 'Torneos y Ligas',
    roles: ['ORGANIZADOR'],
    icono: 'M3 6h4 M3 10h4 M7 6v4 M7 8h5 M3 14h4 M3 18h4 M7 14v4 M7 16h5 M12 8v8 M12 12h5 M17 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
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

// Orden del menú lateral según el rol. Cada rol ve solo lo suyo, en el orden en que trabaja, y la primera entrada es la pantalla
// a la que entra al iniciar sesión (`rutaInicio` en auth/rutaInicio.js): Jugador → Torneos, Recepcionista → Inscripciones,
// Organizador → Torneos y Ligas, Administrador → Usuarios. «Mi cuenta» va siempre al final.
export const ORDEN_MENU_POR_ROL = {
  JUGADOR: ['torneos', 'reservas', 'ranking', 'perfil'],
  RECEPCIONISTA: ['inscripciones', 'calendario', 'reservasClub', 'alquileresFijos', 'socios', 'ranking', 'perfil'],
  ORGANIZADOR: ['gestionTorneos', 'inscripciones', 'calendario', 'ranking', 'reglasPuntuacion', 'perfil'],
  ADMINISTRADOR: ['usuarios', 'gestionTorneos', 'inscripciones', 'calendario', 'reservasClub', 'alquileresFijos', 'socios', 'ranking', 'reglasPuntuacion', 'perfil'],
}

// Breadcrumb del header según la ruta: lista de { texto, ruta?, estado? }. Todas menos la última son un enlace a
// `ruta` (con `estado` para abrir la pestaña de la ficha que corresponde). Las pantallas del menú muestran su nombre.
const miga = (texto, ruta, estado) => ({ texto, ruta, estado })
const { torneos, inscripciones, usuarios, perfil, gestionTorneos, socios, ranking, reglasPuntuacion, reservas } = PANTALLAS
const cuenta = miga('Mi cuenta', perfil.ruta)
const ficha = (id, pestana) => miga('Detalle del torneo', `${gestionTorneos.ruta}/${id}`, pestana && { pestana })

// Cada regla: la ruta y cómo se arma su breadcrumb con lo que capturó (el id del torneo, por ejemplo)
const REGLAS = [
  [/^\/portal\/reservas\/nueva$/, () => [miga(reservas.texto, reservas.ruta), miga('Nueva reserva')]],
  [/^\/portal\/torneos\/([^/]+)\/inscripcion$/, (id) => [miga(torneos.texto, torneos.ruta), miga('Detalle del torneo', `${torneos.ruta}/${id}`), miga('Inscripción')]],
  [/^\/portal\/torneos\/[^/]+$/, () => [miga(torneos.texto, torneos.ruta), miga('Detalle del torneo')]],
  [/^\/gestion\/inscripciones\/[^/]+$/, () => [miga(inscripciones.texto, inscripciones.ruta), miga('Inscriptos')]],
  [/^\/perfil$/, () => [miga('Mi cuenta'), miga('Mi perfil')]],
  [/^\/perfil\/editar$/, () => [cuenta, miga('Mi perfil', perfil.ruta), miga('Editar datos')]],
  [/^\/gestion\/socios\/nuevo$/, () => [miga(socios.texto, socios.ruta), miga('Registrar socio')]],
  [/^\/gestion\/socios\/[^/]+$/, () => [miga(socios.texto, socios.ruta), miga('Detalle del socio')]],
  [/^\/portal\/ranking\/([^/]+)\/[^/]+$/, (clave) => [miga(ranking.texto, ranking.ruta), miga(clave === 'padel' ? 'Pádel' : 'Tenis', clave === 'padel' ? `${ranking.ruta}?disciplina=padel` : ranking.ruta), miga('Detalle del jugador')]],
  [/^\/gestion\/reglas-puntuacion$/, () => [miga(ranking.texto, ranking.ruta), miga(reglasPuntuacion.texto)]],
  [/^\/gestion\/reglas-puntuacion\/[^/]+\/[^/]+\/modificar$/, () => [miga(ranking.texto, ranking.ruta), miga(reglasPuntuacion.texto, reglasPuntuacion.ruta), miga('Modificar regla')]],
  [/^\/admin\/usuarios\/nuevo$/, () => [miga(usuarios.texto, usuarios.ruta), miga('Crear cuenta de personal')]],
  [/^\/admin\/usuarios\/[^/]+$/, () => [miga(usuarios.texto, usuarios.ruta), miga('Detalle de usuario')]],
  [/^\/gestion\/torneos\/nuevo$/, () => [miga(gestionTorneos.texto, gestionTorneos.ruta), miga('Nuevo evento')]],
  [/^\/gestion\/torneos\/([^/]+)\/editar$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id), miga('Editar evento')]],
  [/^\/gestion\/torneos\/([^/]+)\/cabezas-de-serie$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cabezas'), miga('Cabezas de serie')]],
  [/^\/gestion\/torneos\/([^/]+)\/generar-cuadro$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cuadro'), miga('Generar cuadro')]],
  [/^\/gestion\/torneos\/([^/]+)\/archivar$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id), miga('Archivar torneo')]],
  [/^\/gestion\/torneos\/([^/]+)\/partidos\/[^/]+\/programar$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cuadro'), miga('Programar partido')]],
  [/^\/gestion\/torneos\/([^/]+)\/partidos\/[^/]+\/resultado$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cuadro'), miga('Cargar resultado')]],
  [/^\/gestion\/torneos\/([^/]+)\/partidos\/[^/]+\/corregir-resultado$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cuadro'), miga('Corregir resultado')]],
  [/^\/gestion\/torneos\/([^/]+)\/partidos\/[^/]+\/wo$/, (id) => [miga(gestionTorneos.texto, gestionTorneos.ruta), ficha(id, 'cuadro'), miga('Registrar baja / W.O.')]],
  [/^\/gestion\/torneos\/[^/]+$/, () => [miga(gestionTorneos.texto, gestionTorneos.ruta), miga('Detalle del torneo')]],
]

export const migasDe = (pathname) => {
  for (const [patron, armar] of REGLAS) {
    const coincidencia = pathname.match(patron)
    if (coincidencia) return armar(coincidencia[1])
  }
  const pantalla = Object.values(PANTALLAS).find((p) => p.ruta === pathname)
  return pantalla ? [miga(pantalla.texto)] : []
}
