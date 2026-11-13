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
