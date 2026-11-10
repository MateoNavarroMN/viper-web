// Qué páginas mostrar: siempre la primera, la última y las vecinas de la actual; el resto se resume en «…» (null).
// Con 100 páginas y la 50 de actual, en escritorio (vecinas = 1): 1 … 49 50 51 … 100.
// Nunca devuelve más de 2 * vecinas + 5 elementos, así el control no crece con la cantidad de páginas.
export function paginasVisibles(actual, total, vecinas = 1) {
  const maximo = 2 * vecinas + 5
  if (total <= maximo) return Array.from({ length: total }, (_, i) => i + 1)

  const inicioVecinas = Math.max(Math.min(actual - vecinas, total - 2 * vecinas - 2), 3)
  const finVecinas = Math.min(Math.max(actual + vecinas, 2 * vecinas + 3), total - 2)
  const rango = Array.from({ length: finVecinas - inicioVecinas + 1 }, (_, i) => inicioVecinas + i)

  return [
    1,
    inicioVecinas > 3 ? null : 2, // un hueco de una sola página se muestra como número, no como «…»
    ...rango,
    finVecinas < total - 2 ? null : total - 1,
    total,
  ]
}