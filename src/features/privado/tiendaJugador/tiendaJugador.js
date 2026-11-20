// Helpers de la tienda del Jugador (listado con filtros). Los filtros viven en la URL: ?q=&categoria=&precioMin=&precioMax=&orden=

import { escribirPrecio, leerPrecio } from '../torneos/torneos'

export const RUTA_TIENDA_JUGADOR = '/portal/tienda'

// Cuántos productos se piden por vez (el mismo valor por defecto de la API)
export const TAMANIO_PAGINA = 12

export const CATEGORIAS_TIENDA = [
  { valor: '', texto: 'Todos' },
  { valor: 'PRO_SHOP', texto: 'Pro-Shop' },
  { valor: 'BUFFET', texto: 'Buffet' },
]

// El orden elegido se guarda en un solo valor: 'nombre-asc', 'precio-desc', etc.
export const ORDEN_INICIAL = 'nombre-asc'
export const OPCIONES_ORDEN = [
  { valor: 'nombre-asc', texto: 'Nombre (A a Z)' },
  { valor: 'nombre-desc', texto: 'Nombre (Z a A)' },
  { valor: 'precio-asc', texto: 'Precio (menor a mayor)' },
  { valor: 'precio-desc', texto: 'Precio (mayor a menor)' },
]

export const FILTROS_VACIOS = { q: '', categoria: '', precioMin: '', precioMax: '', orden: ORDEN_INICIAL }

// Lee los filtros de la URL. Lo que no se entiende (un enlace viejo o escrito a mano) se ignora y queda el valor inicial.
export const leerFiltros = (parametros) => {
  const categoria = parametros.get('categoria') ?? ''
  const orden = parametros.get('orden') ?? ''
  const precio = (clave) => {
    const valor = parametros.get(clave)
    return valor && /^\d+(\.\d{1,2})?$/.test(valor) ? valor : ''
  }
  return {
    q: (parametros.get('q') ?? '').slice(0, 100),
    categoria: CATEGORIAS_TIENDA.some((c) => c.valor === categoria) ? categoria : '',
    precioMin: precio('precioMin'),
    precioMax: precio('precioMax'),
    orden: OPCIONES_ORDEN.some((o) => o.valor === orden) ? orden : ORDEN_INICIAL,
  }
}

// Escribe los filtros en la URL dejando afuera los que están en su valor inicial
export const aParametros = (filtros) => {
  const parametros = new URLSearchParams()
  if (filtros.q.trim()) parametros.set('q', filtros.q.trim())
  if (filtros.categoria) parametros.set('categoria', filtros.categoria)
  if (filtros.precioMin) parametros.set('precioMin', filtros.precioMin)
  if (filtros.precioMax) parametros.set('precioMax', filtros.precioMax)
  if (filtros.orden !== ORDEN_INICIAL) parametros.set('orden', filtros.orden)
  return parametros
}

// Los filtros y la página, listos para el pedido a la API
export const aConsulta = (filtros, pagina) => {
  const [orden, direccion] = filtros.orden.split('-')
  const consulta = new URLSearchParams({ orden, direccion, pagina: String(pagina), tamanio: String(TAMANIO_PAGINA) })
  if (filtros.q.trim()) consulta.set('q', filtros.q.trim())
  if (filtros.categoria) consulta.set('categoria', filtros.categoria)
  if (filtros.precioMin) consulta.set('precioMin', filtros.precioMin)
  if (filtros.precioMax) consulta.set('precioMax', filtros.precioMax)
  return consulta.toString()
}

// Cuántos filtros hay aplicados (sin contar el orden): para el botón «Filtros y orden» del celular
export const cantidadDeFiltros = (f) => [f.categoria, f.precioMin || f.precioMax, f.orden !== ORDEN_INICIAL].filter(Boolean).length

// 1500.5 → '1500,5' (como lo escribe el jugador en el campo)
export const precioParaCampo = (valor) => (valor ? String(valor).replace('.', ',') : '')

// Revisa los dos campos de precio. Devuelve { min, max } con el número (o '' si está vacío) y, si algo está mal,
// { error: { campo, texto } }. El texto vacío no es un error: significa «sin límite».
export const revisarPrecios = (textoMin, textoMax) => {
  const convertir = (texto) => {
    if (!texto.trim()) return ''
    const numero = leerPrecio(texto)
    return numero === null || numero < 0 ? null : numero
  }
  const min = convertir(textoMin)
  const max = convertir(textoMax)
  if (min === null) return { error: { campo: 'min', texto: 'Ingresá un precio válido, por ejemplo 1500 o 1500,50' } }
  if (max === null) return { error: { campo: 'max', texto: 'Ingresá un precio válido, por ejemplo 1500 o 1500,50' } }
  if (min !== '' && max !== '' && min > max) return { error: { campo: 'max', texto: 'El precio máximo no puede ser menor que el mínimo' } }
  return { min: min === '' ? '' : String(min), max: max === '' ? '' : String(max) }
}

export { escribirPrecio }