import { escribirPrecio } from '../torneos/torneos'

export const DEPORTES = [
  { valor: 'TENIS', texto: 'Tenis' },
  { valor: 'PADEL', texto: 'Pádel' },
]
export const TEXTO_DEPORTE = { TENIS: 'Tenis', PADEL: 'Pádel' }

// Superficies que ofrece el selector. Si el club usa otra, se agrega acá; una cancha con una superficie que no está en la lista
// igual la muestra (ver `opcionesDeSuperficie`).
export const SUPERFICIES = ['Rápida', 'Panorámica']
export const SUPERFICIE_INICIAL = { TENIS: 'Rápida', PADEL: 'Panorámica' }

export const opcionesDeSuperficie = (actual) =>
  [...(actual && !SUPERFICIES.includes(actual) ? [actual] : []), ...SUPERFICIES].map((valor) => ({ valor, texto: valor }))

// «1 reserva futura» / «15 reservas futuras»
export const textoReservasFuturas = (cantidad) => `${cantidad} ${cantidad === 1 ? 'reserva futura' : 'reservas futuras'}`

// Lo que escribe la persona en el campo de precio → número, o null si no es un monto válido (vacío, negativo o con letras).
// Acepta «20000», «20000,5», «20.000,00» (con puntos de miles) y «20000.50».
export const leerPrecio = (texto) => {
  const limpio = String(texto ?? '').trim()
  if (!/^\d[\d.]*(,\d{1,2})?$|^\d+\.\d{1,2}$/.test(limpio)) return null
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(limpio) ? limpio.replace(/\./g, '') : limpio
  const numero = Number(normal)
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero * 100) / 100 : null
}

// Número → texto del campo («20000» → «20.000,00»)
export const textoDePrecio = (numero) => escribirPrecio(numero)