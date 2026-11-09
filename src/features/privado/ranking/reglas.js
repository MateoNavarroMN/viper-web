// Reglas de puntuación (CU 4.3 · RF-17): cuántos puntos da cada instancia de un torneo, por disciplina.
// La API (GET /reglas-puntuacion?disciplina=) devuelve, en orden, la regla que rige hoy de cada instancia:
// { instancia, puntos, vigenteDesde }. Una instancia sin ninguna regla viene con puntos y vigenteDesde en null.

export const RUTA_REGLAS = '/gestion/reglas-puntuacion'

// Máximo que acepta la API
export const MAXIMO_PUNTOS = 1000000

const ETIQUETA = {
  PARTICIPACION: 'Participación',
  VICTORIA_EN_ZONA: 'Victoria en zona',
  CLASIFICADO_DE_ZONA: 'Clasificado de zona',
  SESENTAYCUATROAVOS: 'Sesentaicuatroavos de final',
  TREINTAIDOSAVOS: 'Treintaidosavos de final',
  DIECISEISAVOS: 'Dieciseisavos de final',
  OCTAVOS: 'Octavos de final',
  CUARTOS: 'Cuartos de final',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
  CAMPEON: 'Campeón',
}

// 'VICTORIA_EN_ZONA' → 'Victoria en zona'. Una instancia que todavía no tiene nombre acá se muestra legible igual.
export const nombreInstancia = (instancia) => {
  if (ETIQUETA[instancia]) return ETIQUETA[instancia]
  const texto = instancia.toLowerCase().replaceAll('_', ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const FORMATO = new Intl.NumberFormat('es-AR')

// 120 → '120 puntos' · 1 → '1 punto'
export const puntosLargo = (puntos) => `${FORMATO.format(puntos)} ${puntos === 1 ? 'punto' : 'puntos'}`

// 120 → '120 pts'
export const puntosCorto = (puntos) => `${FORMATO.format(puntos)} pts`

// '2026-11-05' → '05/11/2026'
export const fechaCorta = (texto) => texto.slice(0, 10).split('-').reverse().join('/')

// La fecha de hoy ('AAAA-MM-DD') en Córdoba, la misma que usa la API para «vigente desde hoy»
export const hoyEnCordoba = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' })

// 7a · devuelve el mensaje de error del campo, o '' si el valor es un entero de 0 en adelante
export const validarPuntos = (texto) => {
  const valor = texto.trim()
  if (valor === '') return 'Campo obligatorio'
  if (!/^\d+$/.test(valor)) return 'Ingresá un entero mayor o igual a cero'
  if (Number(valor) > MAXIMO_PUNTOS) return `El máximo es ${FORMATO.format(MAXIMO_PUNTOS)} puntos`
  return ''
}