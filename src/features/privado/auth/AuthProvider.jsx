import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { borrarToken, get, getToken, guardarToken, post, registrarAlSesionInvalida, TOKEN_KEY } from '../../../shared/api/client'
import { useToast } from '../../../shared/hooks/useToast'
import { AuthContext } from './AuthContext'
import { esRutaPrivada, rutaInicio, rutaPermitida } from './rutaInicio'

// Marca que esta pestaña se recargó porque en otra se inició sesión con otra cuenta: al volver, va al panel de su rol
const CAMBIO_DE_CUENTA = 'viper_cambio_de_cuenta'

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  // Mientras haya token guardado, hasta confirmar con /auth/me no sabemos si la sesión sigue válida
  const [cargando, setCargando] = useState(() => Boolean(getToken()))
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  // Al cargar la app: si hay token, /auth/me confirma la sesión y trae los datos del usuario
  useEffect(() => {
    if (!getToken()) return undefined
    let cancelado = false
    get('/auth/me')
      .then((datos) => {
        if (!cancelado) setUsuario(datos.usuario)
      })
      .catch((error) => {
        // 401: el cliente ya limpió la sesión. Si no hubo respuesta (API caída) no se borra el token,
        // pero tampoco hay usuario: se muestra como sin sesión y al recargar se reintenta.
        if (!cancelado && error.status !== 401) setUsuario(null)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Cambió la cuenta en otra pestaña (esta se recargó): si esta pantalla no es del rol de la cuenta nueva, va a su panel
  // y no se queda en «Sin permiso». Esa pantalla solo se ve si alguien escribe la ruta a mano.
  useLayoutEffect(() => {
    if (!usuario) return
    let cambioDeCuenta = false
    try {
      cambioDeCuenta = sessionStorage.getItem(CAMBIO_DE_CUENTA) === '1'
      sessionStorage.removeItem(CAMBIO_DE_CUENTA)
    } catch {
      // sin sessionStorage: se queda donde está
    }
    const { pathname } = window.location
    if (cambioDeCuenta && esRutaPrivada(pathname) && !rutaPermitida(pathname, usuario.rol)) {
      navigate(rutaInicio(usuario.rol), { replace: true })
    }
  }, [usuario, navigate])

  // Sesión vencida o cerrada: el cliente HTTP avisa ante un 401 con token
  useEffect(() => {
    registrarAlSesionInvalida(() => {
      borrarToken()
      setUsuario(null)
      setCargando(false)
      mostrarToast('Tu sesión expiró, volvé a iniciar sesión', 'advertencia')
      navigate('/login?motivo=expirada', { replace: true })
    })
    return () => registrarAlSesionInvalida(null)
  }, [navigate, mostrarToast])

  // Si en otra pestaña se cierra la sesión (o se inicia otra), esta pestaña se entera
  useEffect(() => {
    const alCambiarStorage = (evento) => {
      if (evento.key !== TOKEN_KEY) return
      if (!evento.newValue) {
        setUsuario(null)
        navigate('/login', { replace: true })
      } else {
        try {
          sessionStorage.setItem(CAMBIO_DE_CUENTA, '1')
        } catch {
          // sin sessionStorage: se recarga igual
        }
        window.location.reload()
      }
    }
    window.addEventListener('storage', alCambiarStorage)
    return () => window.removeEventListener('storage', alCambiarStorage)
  }, [navigate])

  // Devuelve el usuario; si las credenciales son malas, lanza el error de la API (error.status, error.mensaje)
  const login = useCallback(async (email, password) => {
    const datos = await post('/auth/login', { email, password })
    guardarToken(datos.token)
    setUsuario(datos.usuario)
    setCargando(false)
    return datos.usuario
  }, [])

  // Cierra la sesión en la API, pero el token se borra aunque la API falle
  const logout = useCallback(async () => {
    try {
      await post('/auth/logout')
    } catch {
      // da igual: igual se cierra del lado del navegador
    } finally {
      borrarToken()
      setUsuario(null)
    }
    mostrarToast('Cerraste sesión correctamente', 'exito')
    navigate('/login', { replace: true })
  }, [navigate, mostrarToast])

  // Para cuando otra pantalla cambia los datos del usuario (por ejemplo Mi perfil): el header se actualiza solo
  const actualizarUsuario = useCallback((datos) => setUsuario(datos), [])

  const valor = useMemo(
    () => ({ usuario, rol: usuario?.rol ?? null, autenticado: Boolean(usuario), cargando, login, logout, actualizarUsuario }),
    [usuario, cargando, login, logout, actualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}