import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../../shared/components/Avatar'
import { ETIQUETA_ROL } from '../auth/permisos'
import { useAuth } from '../auth/useAuth'
import Icono from './Icono'
import { PANTALLAS } from './navegacion'

const ICONO_SALIR = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'

// Pie del menú lateral: avatar, nombre y rol; al tocarlo se abre arriba un menú con Mi perfil y
// Cerrar sesión. A la derecha hay un botón directo para cerrar sesión.
// Se abre con clic o Enter, y se cierra con Escape (devuelve el foco al botón) o tocando afuera.
export default function MenuUsuario({ onNavegar }) {
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

  const itemBase =
    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-fondo transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

  return (
    <div ref={contenedor} className="relative">
      {abierto && (
        <div role="menu" className="absolute bottom-full left-0 right-0 mb-2 bg-panel border border-gray-800 rounded-xl overflow-hidden z-50">
          <Link
            role="menuitem"
            to={PANTALLAS.perfil.ruta}
            onClick={() => {
              setAbierto(false)
              onNavegar?.()
            }}
            className={`${itemBase} border-b border-gray-800`}
          >
            Mi perfil
          </Link>
          <button type="button" role="menuitem" onClick={logout} className={`${itemBase} text-error`}>
            Cerrar sesión
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          ref={boton}
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-haspopup="menu"
          aria-expanded={abierto}
          className="flex-1 min-w-0 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-fondo transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
        >
          <Avatar semilla={usuario.id} tamano={36} />
          <span className="min-w-0 text-left leading-tight">
            <span className="block text-sm truncate">{usuario.nombre} {usuario.apellido}</span>
            <span className="block text-xs text-texto-suave">{ETIQUETA_ROL[rol]}</span>
          </span>
          <span className="sr-only">Menú de usuario</span>
        </button>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          className="p-2 rounded-lg text-texto-suave hover:text-error transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
        >
          <Icono trazo={ICONO_SALIR} />
        </button>
      </div>
    </div>
  )
}