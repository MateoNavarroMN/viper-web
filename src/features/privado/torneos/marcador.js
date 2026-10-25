import { validarMarcador } from './validadorMarcador'

// Lógica de la pantalla «Cargar resultado» (CU 3.6 · pasos 4 y 5): pasa lo que se escribe en las casillas a un marcador,
// lo valida con las mismas reglas que la API (validadorMarcador.js) y dice qué mostrar en cada momento.

export const SETS = 3

// Las casillas: un texto por lado y por set, en orden
export const marcadorVacio = () => Array.from({ length: SETS }, () => ({ local: '', visitante: '' }))

const completo = (s) => s.local !== '' && s.visitante !== ''
const conAlgo = (s) => s.local !== '' || s.visitante !== ''
const numeros = (s) => ({ local: Number(s.local), visitante: Number(s.visitante) })

// El tercer set se juega solo si los dos primeros están bien cargados y quedaron 1 a 1
export const tercerSetHabilitado = (valores) => {
  if (!completo(valores[0]) || !completo(valores[1])) return false
  const { errores, setsGanados } = validarMarcador([numeros(valores[0]), numeros(valores[1])])
  return !errores.some((e) => e.set !== null) && setsGanados.local === 1 && setsGanados.visitante === 1
}

// Analiza las casillas. Devuelve:
//   sets:        los sets cargados completos y en orden (lo que se manda a la API)
//   valido:      true si el marcador está completo y bien
//   ganador:     'LOCAL' | 'VISITANTE' | null
//   setsGanados: { local, visitante } de los sets bien cargados
//   errores:     [{ set, motivo, enVivo }]. `set` es el número de set o null si es del partido entero. `enVivo` es true cuando se
//                puede mostrar mientras se escribe (un set completo que está mal); el resto se muestra al tocar «Guardar Resultado».
//   hayDatos:    true si se escribió algo
export const analizarMarcador = (valores) => {
  const tercero = tercerSetHabilitado(valores)
  const filas = valores.map((s, i) => (i === 2 && !tercero ? { local: '', visitante: '' } : s))
  const hayDatos = filas.some(conAlgo)

  const propios = []
  const sets = []
  let hueco = null // número del primer set vacío, si hay uno antes de un set con datos
  let cortado = false
  filas.forEach((s, i) => {
    const numero = i + 1
    if (!conAlgo(s)) {
      if (hueco === null) hueco = numero
      return
    }
    if (hueco !== null) {
      propios.push({ set: numero, motivo: `Falta cargar el set ${hueco}: los sets se cargan en orden`, enVivo: false })
      return
    }
    if (!completo(s)) {
      propios.push({ set: numero, motivo: `El set ${numero} está incompleto: cargá los games de los dos`, enVivo: false })
      cortado = true
      return
    }
    if (!cortado) sets.push(numeros(s))
  })

  const validado = sets.length > 0 ? validarMarcador(sets) : null
  const delValidador = (validado?.errores ?? []).map((e) => ({ ...e, enVivo: e.set !== null }))
  // Si ya hay un set incompleto o un hueco, «el partido no está definido» sobra: el problema es ese set
  const errores = [...propios, ...delValidador.filter((e) => propios.length === 0 || e.set !== null)]
  if (!hayDatos) errores.push({ set: null, motivo: 'Falta cargar el resultado de los sets', enVivo: false })

  return {
    sets,
    valido: hayDatos && propios.length === 0 && Boolean(validado?.valido),
    ganador: propios.length === 0 ? (validado?.ganador ?? null) : null,
    setsGanados: validado?.setsGanados ?? { local: 0, visitante: 0 },
    errores,
    hayDatos,
    tercero,
  }
}