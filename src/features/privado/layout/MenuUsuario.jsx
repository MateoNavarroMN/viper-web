import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ETIQUETA_ROL } from '../auth/permisos'
import { useAuth } from '../auth/useAuth'
import Icono from './Icono'
import { PANTALLAS } from './navegacion'

// Menú del header: nombre y rol, y las acciones Mi perfil y Cerrar sesión.
// Se abre con clic o Enter, y se cierra con Escape (devuelve el foco al botón) o tocando afuera.
export default function MenuUsuario() {
  const { usuario, rol, logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const boton = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined
    const alTocarAfuera = (evento) => {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('mousedown', alTocarAfuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('mousedown', alTocarAfuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  const iniciales = `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
  const itemBase =
    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-fondo transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-panel transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
      >
        <span className="w-9 h-9 rounded-full bg-viper/15 text-viper font-semibold flex items-center justify-center" aria-hidden="true">
          {iniciales}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block font-medium">{usuario.nombre} {usuario.apellido}</span>
          <span className="block text-sm text-texto-suave">{ETIQUETA_ROL[rol]}</span>
        </span>
        <svg className="text-texto-suave" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="sr-only">Menú de usuario</span>
      </button>

      {abierto && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-panel border border-gray-800 rounded-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-800 sm:hidden">
            <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
            <p className="text-sm text-texto-suave">{ETIQUETA_ROL[rol]}</p>
          </div>
          <Link role="menuitem" to={PANTALLAS.perfil.ruta} onClick={() => setAbierto(false)} className={itemBase}>
            <Icono trazo={PANTALLAS.perfil.icono} />
            Mi perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false)
              logout()
            }}
            className={`${itemBase} text-error`}
          >
            <Icono trazo="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}