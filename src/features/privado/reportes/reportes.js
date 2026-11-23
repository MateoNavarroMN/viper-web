import { fechaDeHoy } from '../socios/socios'

// Helpers del formulario de exportación de reportes.

// Primer y último día del mes en curso (hora del club) como fechas ISO: es el rango con el que se abre el formulario sin filtros
export const mesActual = () => {
  const hoy = fechaDeHoy()
  const [anio, mes] = hoy.split('-').map(Number)
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  return { desde: `${hoy.slice(0, 8)}01`, hasta: `${hoy.slice(0, 8)}${String(ultimo).padStart(2, '0')}` }
}

export const esFechaISO = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto ?? '') && !Number.isNaN(Date.parse(`${texto}T00:00:00Z`))

export const FORMATOS = {
  excel: { texto: 'Excel', ruta: '/reportes/excel', extension: 'xlsx' },
  pdf: { texto: 'PDF', ruta: '/reportes/pdf', extension: 'pdf' },
}

// Guarda un archivo que se descargó como Blob: crea un enlace temporal, lo «toca» y lo descarta
export const guardarArchivo = (blob, nombre) => {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}