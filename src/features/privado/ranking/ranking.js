// Ranking por disciplina (CU 3.6 · RF-18). La API devuelve la lista ya ordenada; acá solo viven las pestañas y los textos.

// Pestañas de disciplina. `url` es el valor del parámetro ?disciplina= y `api` el que espera GET /ranking/:disciplina
export const DISCIPLINAS = [
  { clave: 'tenis', titulo: 'Tenis', api: 'TENIS' },
  { clave: 'padel', titulo: 'Pádel', api: 'PADEL' },
]

export const PESTANAS = DISCIPLINAS.map(({ clave, titulo }) => ({ clave, titulo }))

// 'tenis' | 'padel' (cualquier otro valor, o ninguno, abre Tenis)
export const disciplinaDe = (valor) => DISCIPLINAS.find((d) => d.clave === valor) ?? DISCIPLINAS[0]

// 'Martina Pérez'
export const nombreCompleto = (jugador) => `${jugador.nombre} ${jugador.apellido}`

// 1 jugador, 2 jugadores
export const cantidadJugadores = (n) => `${n} ${n === 1 ? 'jugador' : 'jugadores'}`

// Sin tildes ni mayúsculas, para que «perez» encuentre a «Pérez»
const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// Filas cuyo nombre o apellido contiene todas las palabras buscadas («mar per» encuentra a «Martina Pérez»).
// La posición no cambia: la que viene de la API es la del ranking, no la de la búsqueda.
export const buscarEnRanking = (filas, busqueda) => {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return filas
  return filas.filter((f) => {
    const nombre = normalizar(nombreCompleto(f.jugador))
    return palabras.every((palabra) => nombre.includes(palabra))
  })
}