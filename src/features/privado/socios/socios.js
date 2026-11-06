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