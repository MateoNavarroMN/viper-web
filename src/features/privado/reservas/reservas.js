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
