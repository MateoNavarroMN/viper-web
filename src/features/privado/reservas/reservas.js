// Lógica de la grilla de reservas. Las fechas son texto 'AAAA-MM-DD' (así las pide y las devuelve la API), para no correr un día por la zona horaria.

export const DEPORTES = [
  { clave: '', texto: 'Todos' },
  { clave: 'TENIS', texto: 'Tenis' },
  { clave: 'PADEL', texto: 'Pádel' },
]

// Lo que ve el personal de cada reserva ocupada (el Jugador solo ve «Ocupada»)
export const TIPOS_OCUPACION = {
  OCASIONAL: { texto: 'Alquiler', estilo: 'alquiler' },
  FIJA: { texto: 'Reserva fija', estilo: 'fija' },
  TORNEO: { texto: 'Torneo', estilo: 'torneo' },
}

// Cada cuánto se vuelve a pedir la grilla mientras la pantalla está abierta
export const REFRESCO_MS = 30000

// '19:00' → 'HH:MM' de la hora actual del navegador, para «Actualizada a las…»
export const horaDe = (fecha) => `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`

// Las canchas se piden de a una disciplina; «Todos» junta las de las dos
export const disciplinasDe = (deporte) => (deporte ? [deporte] : ['TENIS', 'PADEL'])


// Cómo se llama cada tipo de reserva en el detalle
export const TIPO_LARGO = {
  OCASIONAL: 'Alquiler (ocasional)',
  FIJA: 'Reserva fija',
  TORNEO: 'Torneo',
}

// Las acciones sobre una reserva ocupada, en el orden en que se ofrecen. Las decide la API (`acciones` del detalle). Cada tarea que
// implementa una le pasa su manejador al panel; mientras no lo tiene, una acción permitida se muestra sin habilitar.
export const ACCIONES_RESERVA = [
  { clave: 'registrarCobro', texto: 'Registrar cobro', variante: 'primario' },
  { clave: 'modificarHorario', texto: 'Modificar horario', variante: 'neutro' },
  { clave: 'reasignarCancha', texto: 'Reasignar cancha', variante: 'neutro' },
  { clave: 'cancelar', texto: 'Cancelar reserva', variante: 'peligro-borde' },
]

// '2026-11-13T22:21:00.000Z' → '13/11, 19:21' en la hora del navegador
export const fechaHoraCorta = (iso) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })


// ---- Solicitud de reserva (Jugador) ----

// Lo mismo que PLAZO_PAGO_HORAS de la API: una reserva Pendiente vence a las 24 horas o al empezar el turno, lo que ocurra primero
export const PLAZO_PAGO_HORAS = 24

// Cómo puede pagar el Jugador. El pago en línea depende del Módulo 5 (Mercado Pago) y por ahora no se puede elegir.
export const MEDIOS_PAGO = [
  { clave: 'RECEPCION', titulo: 'Pagar en recepción', detalle: 'Tenés 24 hs para pagar en el club. Si no, se libera la franja.', disponible: true },
  { clave: 'EN_LINEA', titulo: 'Pagar en línea', detalle: 'Con Mercado Pago. Queda confirmada al aprobarse el cobro.', disponible: false },
]

// Cuánto tiempo tiene el Jugador para pagar. El club está en Córdoba (UTC-3 todo el año), así que el inicio del turno es '…-03:00'.
// Devuelve { hastaInicio, limite }: `hastaInicio` es true si el turno empieza antes de las 24 horas (entonces vence al empezar).
export const plazoDePago = (fecha, horaInicio, ahora = new Date()) => {
  const inicio = new Date(`${fecha}T${horaInicio}:00-03:00`)
  const en24 = new Date(ahora.getTime() + PLAZO_PAGO_HORAS * 3600000)
  return inicio <= en24 ? { hastaInicio: true, limite: inicio } : { hastaInicio: false, limite: en24 }
}

// '19:00' → '20:00' (los turnos del Jugador son de 60 minutos)
export const finDeTurno = (horaInicio, minutos = 60) => {
  const total = Number(horaInicio.slice(0, 2)) * 60 + Number(horaInicio.slice(3, 5)) + minutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Enlace a la pantalla de solicitud para un turno libre
export const rutaNuevaReserva = ({ canchaId, fecha, hora, deporte }) => {
  const params = new URLSearchParams({ canchaId, fecha, hora })
  if (deporte) params.set('deporte', deporte)
  return `/portal/reservas/nueva?${params}`
}


// ---- Mis reservas (Jugador) ----

export const VISTAS_MIS_RESERVAS = [
  { clave: 'proximas', texto: 'Próximas' },
  { clave: 'historial', texto: 'Historial' },
]

// Lo que el Jugador puede hacer con una reserva suya, en el orden en que se ofrece. Las decide la API (`acciones`).
// Cobrar y reasignar son de recepción: el Jugador no las ve.
export const ACCIONES_JUGADOR = [
  { clave: 'modificarHorario', texto: 'Modificar horario', variante: 'neutro' },
  { clave: 'cancelar', texto: 'Cancelar reserva', variante: 'peligro-borde' },
]

// Milisegundos que faltan → «1 d 3 h», «3 h 20 min», «45 min» o «menos de 1 min»
export const tiempoRestante = (ms) => {
  const minutos = Math.floor(ms / 60000)
  if (minutos < 1) return 'menos de 1 min'
  const dias = Math.floor(minutos / 1440)
  const horas = Math.floor((minutos % 1440) / 60)
  if (dias > 0) return `${dias} d ${horas} h`
  if (horas > 0) return `${horas} h ${minutos % 60} min`
  return `${minutos} min`
}

// ---- Turno directo (recepción) ----

// Los horarios que puede cargar Recepción: cada 30 minutos, de la apertura (08:00) al cierre (23:00)
export const HORARIOS_CLUB = Array.from({ length: 31 }, (_, i) => {
  const minutos = 8 * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

const minutosDe = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))

// Duración en minutos entre dos horas 'HH:MM'
export const duracionEntre = (horaInicio, horaFin) => minutosDe(horaFin) - minutosDe(horaInicio)

// 90 → '1 h 30 min'
export const textoDuracion = (minutos) => {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return [horas && `${horas} h`, resto && `${resto} min`].filter(Boolean).join(' ')
}

// Precio del turno: lo mismo que calcula la API (precio por hora proporcional a la duración)
export const precioDelTurno = (precioHora, horaInicio, horaFin) =>
  Math.round((Number(precioHora) * duracionEntre(horaInicio, horaFin)) / 60 * 100) / 100

// ¿El turno ya empezó? El club está en Córdoba (UTC-3 todo el año).
export const turnoYaEmpezo = (fecha, horaInicio, ahora = new Date()) => new Date(`${fecha}T${horaInicio}:00-03:00`) <= ahora

// Cómo se cobra un turno cargado por Recepción
export const FORMAS_DE_COBRO = [
  { clave: 'AHORA', titulo: 'Cobrar ahora', detalle: 'Queda confirmada al guardar, con el medio de pago que elijas.' },
  { clave: 'PENDIENTE', titulo: 'Queda pendiente (24 horas)', detalle: 'El cliente paga después. Si no paga a tiempo, se libera la franja.' },
]
export const METODOS_DE_COBRO = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
]
export const TEXTO_METODO_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', MERCADO_PAGO: 'Mercado Pago' }

// Enlace a la pantalla del turno directo para un turno libre de la grilla del club
export const rutaTurnoDirecto = ({ canchaId, fecha, hora, deporte }) => {
  const params = new URLSearchParams({ canchaId, fecha, hora })
  if (deporte) params.set('deporte', deporte)
  return `/gestion/reservas/nueva?${params}`
}

// ---- Cancelar una reserva ----

// Lo mismo que ANTICIPACION_CANCELACION_HORAS de la API: el Jugador cancela hasta 3 horas antes; el personal, hasta que empiece el turno
export const ANTICIPACION_CANCELACION_HORAS = 3

// ¿Faltan menos de 3 horas para que empiece el turno? (hora de Córdoba, UTC-3 todo el año)
export const faltaPocoParaElTurno = (fecha, horaInicio, ahora = new Date()) =>
  new Date(`${fecha}T${horaInicio}:00-03:00`).getTime() - ahora.getTime() < ANTICIPACION_CANCELACION_HORAS * 3600000