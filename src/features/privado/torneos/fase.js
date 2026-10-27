import { nombreCorto } from './torneos'

// Lógica de la pantalla «Generar fase eliminatoria» (CU 3.9). Son funciones puras: la API (M3-BE-22) es la que decide de
// verdad si se puede generar; esto solo adelanta lo que va a pasar para mostrarlo antes de apretar el botón.
// `zonas` es la lista de zonas de GET /torneos/:id/cuadro: [{ id, nombre, cerrada, posiciones, partidos }].

// La eliminatoria se arma sobre una llave de potencia de 2: 6 clasificados → cuadro de 8 con 2 byes
export const tamanoDeLlave = (clasificados) => {
  let tamano = 2
  while (tamano < clasificados) tamano *= 2
  return tamano
}

const resuelto = (partido) => partido.estado === 'FINALIZADO' || partido.estado === 'WO'

// Estado de cada zona: cuántos partidos le faltan y, si ya terminó, qué empates quedan entre los que clasifican.
// Un empate decide el orden de los clasificados, así que cuenta aunque los empatados clasifiquen todos (igual que la API).
export const estadoDeZonas = (zonas, clasificanPorZona) =>
  zonas.map((zona) => {
    const pendientes = zona.partidos.filter((p) => !p.esBye && !resuelto(p)).length
    const completa = zona.partidos.length > 0 && pendientes === 0

    const porPosicion = new Map()
    for (const fila of zona.posiciones) {
      if (fila.posicion === null) continue
      porPosicion.set(fila.posicion, [...(porPosicion.get(fila.posicion) ?? []), fila])
    }
    const empates = completa
      ? [...porPosicion.entries()]
        .filter(([posicion, filas]) => filas.length > 1 && posicion <= clasificanPorZona)
        .map(([posicion, filas]) => ({ posicion, filas }))
      : []

    const clasificados = zona.posiciones
      .filter((fila) => fila.posicion !== null && fila.posicion <= clasificanPorZona)
      .sort((a, b) => a.posicion - b.posicion)
    return { id: zona.id, nombre: zona.nombre, completa, pendientes, empates, clasificados }
  })

// Todo lo que la pantalla muestra antes de generar. Con un empate sin resolver los empatados figuran todos en `clasificados` de
// la zona, pero a la llave entran solo `clasificanPorZona`.
export const resumenDeFase = (zonas, clasificanPorZona) => {
  const estado = estadoDeZonas(zonas, clasificanPorZona)
  const clasificados = estado.reduce((suma, z) => suma + Math.min(z.clasificados.length, clasificanPorZona), 0)
  const tamano = tamanoDeLlave(clasificados)
  const pendientes = estado.filter((z) => !z.completa)
  const conEmpate = estado.filter((z) => z.completa && z.empates.length > 0)
  return {
    zonas: estado,
    cerradas: estado.length - pendientes.length,
    pendientes,
    conEmpate,
    clasificados,
    tamano,
    byes: tamano - clasificados,
    puedeGenerar: estado.length > 0 && pendientes.length === 0 && conEmpate.length === 0 && clasificados >= 2,
  }
}

// «PG 2 · SG 4–3»: partidos ganados y sets a favor y en contra de una fila de la tabla de la zona
export const estadisticaCorta = (fila) => `PG ${fila.partidosGanados} · SG ${fila.setsGanados}–${fila.setsPerdidos}`

// '1° A' para un participante del cuadro (el puesto que tuvo en su zona), o null si no salió de una zona
const etiquetaDeLugar = (participante, zonas) => {
  for (const zona of zonas) {
    const fila = zona.posiciones.find((p) => p.participante?.inscripcionId === participante.inscripcionId)
    if (fila) return `${fila.posicion}° ${zona.nombre.replace(/^Zona\s+/i, '')}`
  }
  return null
}

// Cruces de la primera ronda con el puesto de cada uno: [{ id, texto }], por ejemplo '1° A vs BYE' o '2° B vs 2° C'
export const crucesDePrimeraRonda = (rondas, zonas) => {
  if (rondas.length === 0) return []
  return rondas[0].partidos.map((partido) => {
    const lado = (p) => (p ? etiquetaDeLugar(p, zonas) ?? nombreCorto(p) : 'BYE')
    return { id: partido.id, texto: `${lado(partido.local)} vs ${lado(partido.visitante)}` }
  })
}

// ¿Algún partido de la eliminatoria ya se jugó o terminó por W.O.? Entonces no se puede regenerar (8a). Los byes no cuentan.
export const eliminatoriaConResultados = (rondas) =>
  rondas.some((ronda) => ronda.partidos.some((p) => !p.esBye && resuelto(p)))