// Cliente HTTP simple sobre fetch. Todas las pantallas llaman a la API con estas funciones.
// El cuerpo es un objeto (se manda como JSON) o un FormData (multipart, para subir archivos).
// Si la API responde con error, se lanza un Error con:
//   error.status  → código HTTP (0 si no hubo respuesta)
//   error.mensaje → texto para mostrar al usuario
//   error.campo   → nombre del campo con problema (si la API lo informa), para resaltarlo en rojo
//   error.segundosRestantes → solo en el 423 de login
//   error.datos → el cuerpo completo de la respuesta de error (por ejemplo `pagadas` y `minimoInscriptos` en un 409)
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

// Clave donde se guarda el token JWT (lo maneja AuthProvider)
export const TOKEN_KEY = 'viper_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const guardarToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const borrarToken = () => localStorage.removeItem(TOKEN_KEY)

// Si la API responde 401 a una llamada hecha con token (sesión vencida o cerrada), se avisa
// a quien se registró acá (AuthProvider) para que limpie la sesión y lleve a /login.
let alSesionInvalida = null
export const registrarAlSesionInvalida = (funcion) => {
  alSesionInvalida = funcion
}
// En estas rutas un 401 no significa "sesión vencida" (credenciales mal, o logout sobre una sesión ya cerrada)
const RUTAS_SIN_AVISO_401 = ['/auth/login', '/auth/registro', '/auth/logout']

async function pedir(metodo, ruta, cuerpo) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  // Un FormData (por ejemplo, con un archivo) se manda tal cual: el navegador pone solo el Content-Type con su separador
  const esFormulario = typeof FormData !== 'undefined' && cuerpo instanceof FormData
  if (cuerpo !== undefined && !esFormulario) headers['Content-Type'] = 'application/json'

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esFormulario ? cuerpo : JSON.stringify(cuerpo),
    })
  } catch {
    const error = new Error('No se pudo conectar con el servidor')
    error.status = 0
    error.mensaje = 'No se pudo conectar con el servidor'
    throw error
  }

  // Algunas respuestas no traen cuerpo (por ejemplo 204) o no son JSON
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    // Solo si el token enviado sigue siendo el actual (evita avisar por respuestas viejas de otra sesión)
    if (respuesta.status === 401 && token && token === getToken() && !RUTAS_SIN_AVISO_401.includes(ruta)) {
      alSesionInvalida?.()
    }
    const mensaje = datos?.mensaje ?? 'Ocurrió un error inesperado'
    const error = new Error(mensaje)
    error.status = respuesta.status
    error.mensaje = mensaje
    error.campo = datos?.campo
    error.segundosRestantes = datos?.segundosRestantes
    error.datos = datos
    throw error
  }

  return datos
}

// Descarga un archivo (Excel, PDF…) que genera la API. Se pide con `fetch` y el token (un enlace directo no lleva la sesión) y
// se devuelve como Blob, más el nombre que sugiere la API en `Content-Disposition`.
// Los errores son los mismos que los de `get`: error.status y error.mensaje (la API los responde en JSON).
//   const { blob, nombre } = await descargar('/reportes/excel?desde=2026-11-01&hasta=2026-11-30')
export async function descargar(ruta) {
  const token = getToken()
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    const error = new Error('No se pudo conectar con el servidor')
    error.status = 0
    error.mensaje = 'No se pudo conectar con el servidor'
    throw error
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null)
    if (respuesta.status === 401 && token && token === getToken()) alSesionInvalida?.()
    const error = new Error(datos?.mensaje ?? 'Ocurrió un error inesperado')
    error.status = respuesta.status
    error.mensaje = datos?.mensaje ?? 'Ocurrió un error inesperado'
    error.campo = datos?.campo
    error.datos = datos
    throw error
  }
  const nombre = /filename="?([^";]+)"?/.exec(respuesta.headers.get('Content-Disposition') ?? '')?.[1] ?? null
  return { blob: await respuesta.blob(), nombre }
}

export const get = (ruta) => pedir('GET', ruta)
export const post = (ruta, cuerpo) => pedir('POST', ruta, cuerpo ?? {})
export const put = (ruta, cuerpo) => pedir('PUT', ruta, cuerpo ?? {})
export const patch = (ruta, cuerpo) => pedir('PATCH', ruta, cuerpo ?? {})