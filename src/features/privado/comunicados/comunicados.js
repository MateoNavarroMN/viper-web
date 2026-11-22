// Comunicados oficiales (CU 6.3 · RF-26). Constantes y textos compartidos por el listado, el formulario y el detalle.

// Los mismos límites que valida la API (y la base de datos)
export const LIMITES = { titulo: 120, mensaje: 2000 }

export const ALCANCES = [
  { valor: 'TODOS', texto: 'Todos', ayuda: 'Jugadores y socios' },
  { valor: 'SOLO_SOCIOS', texto: 'Solo socios', ayuda: 'Solo los socios activos del club' },
]

// A quiénes se les muestra, para la confirmación de publicar
export const TEXTO_PUBLICO = { TODOS: 'Todos los jugadores', SOLO_SOCIOS: 'Solo los socios' }

export const OPCIONES_ESTADO = [
  { valor: '', texto: 'Estado: todos' },
  { valor: 'BORRADOR', texto: 'Borrador' },
  { valor: 'PUBLICADO', texto: 'Publicado' },
  { valor: 'RETIRADO', texto: 'Retirado' },
]

const dos = (n) => String(n).padStart(2, '0')

// '2026-11-18T12:15:00.000Z' → '18/11/2026 09:15' (hora del navegador); sin fecha (un borrador) → '—'
export const fechaYHora = (iso) => {
  if (!iso) return '—'
  const f = new Date(iso)
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

export const nombreDelAutor = (autor) => `${autor.nombre} ${autor.apellido}`

// 1 comunicado, 2 comunicados
export const cantidadComunicados = (n) => `${n} ${n === 1 ? 'comunicado' : 'comunicados'}`