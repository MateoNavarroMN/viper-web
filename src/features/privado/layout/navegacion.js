// Pantallas privadas, con los roles que pueden entrar. La usan el menú lateral
// (muestra solo las del rol) y App.jsx (RequireRol), así la regla está escrita una sola vez.
// `roles` sigue la jerarquía de auth/permisos.js: el ADMINISTRADOR entra a lo de RECEPCIONISTA y ORGANIZADOR.
// `icono` es el path de un SVG de 24x24 (trazo).
export const PANTALLAS = {
  inicio: {
    ruta: '/portal/inicio',
    texto: 'Inicio',
    roles: ['JUGADOR'],
    // Casa con esquinas suaves
    icono: 'M3 10.5 12 3l9 7.5V19a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z',
  },
  novedades: {
    ruta: '/portal/novedades',
    texto: 'Novedades',
    roles: ['JUGADOR'],
    // Megáfono de avisos
    icono: 'M3 11l14-5v12L3 13v-2z M7 13.8l1.5 5.2a1.5 1.5 0 0 0 2.9-.8L10 14.3 M20 9a5 5 0 0 1 0 6',
  },
  torneos: {
    ruta: '/portal/torneos',
    texto: 'Torneos',
    roles: ['JUGADOR'],
    // Trofeo
    icono: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z',
  },
  ranking: {
    ruta: '/portal/ranking',
    texto: 'Ranking',
    roles: ['JUGADOR', 'RECEPCIONISTA', 'ORGANIZADOR'],
    // Podio de clasificación (1°, 2° y 3°)
    icono: 'M3 20h18 M4 20v-7h5 M9 20V8h6v12 M15 15h5v5',
  },
  dashboard: {
    ruta: '/admin/dashboard',
    texto: 'Dashboard',
    roles: ['ADMINISTRADOR'],
    // Grilla modular con esquinas redondeadas
    icono: 'M4.5 3h4A1.5 1.5 0 0 1 10 4.5v6A1.5 1.5 0 0 1 8.5 12h-4A1.5 1.5 0 0 1 3 10.5v-6A1.5 1.5 0 0 1 4.5 3z M15.5 3h4A1.5 1.5 0 0 1 21 4.5v2A1.5 1.5 0 0 1 19.5 8h-4A1.5 1.5 0 0 1 14 6.5v-2A1.5 1.5 0 0 1 15.5 3z M15.5 12h4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5z M4.5 16h4a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-2A1.5 1.5 0 0 1 4.5 16z',
  },
  inscripciones: {
    ruta: '/gestion/inscripciones',
    texto: 'Inscripciones',
    roles: ['RECEPCIONISTA', 'ORGANIZADOR'],
    // Planilla con tilde de confirmación
    icono: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M9 14l2 2 4-4',
  },
  calendario: {
    ruta: '/gestion/calendario',
    texto: 'Calendario',
    roles: ['RECEPCIONISTA', 'ORGANIZADOR'],
    // Calendario general
    icono: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  },
  tiendaJugador: {
    ruta: '/portal/tienda',
    texto: 'Tienda',
    roles: ['JUGADOR'],
    // Bolsa de compras
    icono: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  },
  socios: {
    ruta: '/gestion/socios',
    texto: 'Socios y cuotas',
    roles: ['RECEPCIONISTA'],
    // Credencial de socio espaciada
    icono: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M6 16a3 3 0 0 1 6 0 M15 10h4 M15 14h3',
  },
  tienda: {
    ruta: '/gestion/tienda',
    texto: 'Tienda',
    roles: ['RECEPCIONISTA'],
    // Bolsa de compras (consistente con el portal)
    icono: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  },
  caja: {
    ruta: '/gestion/caja',
    texto: 'Caja',
    roles: ['RECEPCIONISTA'],
    // Billete con esquinas redondeadas
    icono: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M6 12h.01 M18 12h.01',
  },
  reglasPuntuacion: {
    ruta: '/gestion/reglas-puntuacion',
    texto: 'Reglas de puntuación',
    roles: ['ORGANIZADOR'],
    // Ecualizador / parámetros de puntaje
    icono: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  },
  reservas: {
    ruta: '/portal/reservas',
    texto: 'Reservas',
    roles: ['JUGADOR'],
    // Calendario con reloj (turno reservado)
    icono: 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5 M16 2v4 M8 2v4 M3 10h5 M17.5 17.5 16 16.3V14 M16 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  },
  reservasClub: {
    ruta: '/gestion/reservas',
    texto: 'Reservas',
    roles: ['RECEPCIONISTA'],
    // Calendario con reloj (coherente con Reservas del jugador)
    icono: 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5 M16 2v4 M8 2v4 M3 10h5 M17.5 17.5 16 16.3V14 M16 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  },
  alquileresFijos: {
    ruta: '/gestion/alquileres-fijos',
    texto: 'Alquileres fijos',
    roles: ['RECEPCIONISTA'],
    // Ciclo recurrente semanal
    icono: 'M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3',
  },
  canchas: {
    ruta: '/admin/canchas',
    texto: 'Canchas y tarifas',
    roles: ['ADMINISTRADOR'],
    // Cancha de tenis/pádel vista desde arriba (red y cuadros de saque)
    icono: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M12 5v14 M7 5v14 M17 5v14 M7 12h10',
  },
  comunicados: {
    ruta: '/gestion/comunicados',
    texto: 'Comunicados',
    roles: ['ADMINISTRADOR'],
    // Megáfono (coherente con Novedades del jugador)
    icono: 'M3 11l14-5v12L3 13v-2z M7 13.8l1.5 5.2a1.5 1.5 0 0 0 2.9-.8L10 14.3 M20 9a5 5 0 0 1 0 6',
  },
  gestionTorneos: {
    ruta: '/gestion/torneos',
    texto: 'Torneos y Ligas',
    roles: ['ORGANIZADOR'],
    // Llave de torneo (bracket)
    icono: 'M3 5h4v4H3 M3 15h4v4H3 M7 7h5v10H7 M12 12h9',
  },
  usuarios: {
    ruta: '/admin/usuarios',
    texto: 'Usuarios',
    roles: ['ADMINISTRADOR'],
    // Grupo de usuarios
    icono: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  perfil: {
    ruta: '/perfil',
    texto: 'Mi cuenta',
    roles: ['JUGADOR', 'RECEPCIONISTA', 'ORGANIZADOR', 'ADMINISTRADOR'],
    // Usuario individual
    icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
}

// Orden del menú lateral según el rol. Cada rol ve solo lo suyo, agrupado por lo que hace durante el día: lo que más usa primero y lo
// que se toca poco (configuración, usuarios) al final. «Mi cuenta» va siempre última. La primera entrada es la pantalla a la que
// entra al iniciar sesión (`rutaInicio` en auth/rutaInicio.js): Jugador → Inicio, Recepcionista → Reservas, Organizador → Torneos y Ligas,
// Administrador → Dashboard.
//   Jugador:       Inicio · Reservas · Torneos · Ranking · Tienda · Novedades · Mi cuenta
//   Recepcionista: turnos (Reservas, Alquileres fijos, Calendario) · torneos (Inscripciones) · club (Socios y cuotas, Tienda, Caja) · Ranking
//   Organizador:   Torneos y Ligas · Inscripciones · Calendario · Ranking · Reglas de puntuación (las reglas junto al ranking que afectan)
//   Administrador: Dashboard · turnos y canchas · torneos y ranking · socios, tienda y caja · Comunicados · Usuarios
export const ORDEN_MENU_POR_ROL = {
  JUGADOR: ['inicio', 'reservas', 'torneos', 'ranking', 'tiendaJugador', 'novedades', 'perfil'],
  RECEPCIONISTA: ['reservasClub', 'alquileresFijos', 'calendario', 'inscripciones', 'socios', 'tienda', 'caja', 'ranking', 'perfil'],
  ORGANIZADOR: ['gestionTorneos', 'inscripciones', 'calendario', 'ranking', 'reglasPuntuacion', 'perfil'],
  ADMINISTRADOR: [
    'dashboard',
    'reservasClub', 'alquileresFijos', 'calendario', 'canchas',
    'gestionTorneos', 'inscripciones', 'ranking', 'reglasPuntuacion',
    'socios', 'tienda', 'caja',
    'comunicados', 'usuarios',
    'perfil',
  ],
}

// Breadcrumb del header según la ruta: lista de { texto, ruta?, estado? }. Todas menos la última son un enlace a
// `ruta` (con `estado` para abrir la pestaña de la ficha que corresponde). Las pantallas del menú muestran su nombre.
const miga = (texto, ruta, estado) => ({ texto, ruta, estado })
const { torneos, inscripciones, usuarios, perfil, gestionTorneos, socios, ranking, reglasPuntuacion, reservas, reservasClub, alquileresFijos, canchas, tienda, tiendaJugador, comunicados } = PANTALLAS
const cuenta = miga('Mi cuenta', perfil.ruta)
const ficha = (id, pestana) => miga('Detalle del torneo', `${gestionTorneos.ruta}/${id}`, pestana && { pestana })

// Cada regla: la ruta y cómo se arma su breadcrumb con lo que capturó (el id del torneo, por ejemplo)
const REGLAS = [
  [/^\/gestion\/reservas\/nueva$/, () => [miga(reservasClub.texto, reservasClub.ruta), miga('Turno directo')]],
  [/^\/gestion\/alquileres-fijos\/nuevo$/, () => [miga(alquileresFijos.texto, alquileresFijos.ruta), miga('Nuevo alquiler fijo')]],
  [/^\/gestion\/alquileres-fijos\/[^/]+$/, () => [miga(alquileresFijos.texto, alquileresFijos.ruta), miga('Detalle del contrato')]],
  [/^\/admin\/canchas$/, () => [miga(reservasClub.texto, reservasClub.ruta), miga(canchas.texto)]],
  [/^\/admin\/canchas\/[^/]+\/editar$/, () => [miga(reservasClub.texto, reservasClub.ruta), miga(canchas.texto, canchas.ruta), miga('Editar cancha')]],
  [/^\/admin\/canchas\/nueva$/, () => [miga(reservasClub.texto, reservasClub.ruta), miga(canchas.texto, canchas.ruta), miga('Nueva cancha')]],
  [/^\/gestion\/comunicados\/[^/]+\/editar$/, () => [miga(comunicados.texto, comunicados.ruta), miga('Editar borrador')]],
  [/^\/gestion\/comunicados\/nuevo$/, () => [miga(comunicados.texto, comunicados.ruta), miga('Nuevo comunicado')]],
  [/^\/gestion\/comunicados\/[^/]+$/, () => [miga(comunicados.texto, comunicados.ruta), miga('Detalle del comunicado')]],
  [/^\/gestion\/tienda\/productos\/nuevo$/, () => [miga(tienda.texto, tienda.ruta), miga('Nuevo producto')]],
  [/^\/gestion\/tienda\/productos\/[^/]+\/editar$/, () => [miga(tienda.texto, tienda.ruta), miga('Editar producto')]],
  [/^\/portal\/tienda\/[^/]+$/, () => [miga(tiendaJugador.texto, tiendaJugador.ruta), miga('Detalle del producto')]],
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