// Helpers de la sección Socios y cuotas (CU 4.1 y 4.2).

// DNI con puntos de miles: 38221045 → 38.221.045
export const dniConPuntos = (dni) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const OPCIONES_ESTADO_SOCIO = [
  { valor: '', texto: 'Estado: Todos' },
  { valor: 'ACTIVO', texto: 'Activo' },
  { valor: 'BAJA', texto: 'Baja' },
]

export const OPCIONES_CUOTAS_SOCIO = [
  { valor: '', texto: 'Cuotas: Todas' },
  { valor: 'AL_DIA', texto: 'Al día' },
  { valor: 'ADEUDADO', texto: 'Adeudado' },
]

export const DISCIPLINAS = [
  { clave: 'TENIS', texto: 'Tenis' },
  { clave: 'PADEL', texto: 'Pádel' },
]

// Estado que se muestra de una cuota: las pendientes con el vencimiento pasado figuran «Vencida» (la API ya manda `vencida`).
export const estadoDeCuota = (cuota) => (cuota.estadoPago === 'PAGADO' ? 'PAGADA' : cuota.vencida ? 'VENCIDA' : 'PENDIENTE')