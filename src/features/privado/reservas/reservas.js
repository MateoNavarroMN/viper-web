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