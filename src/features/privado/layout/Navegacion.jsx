import { NavLink } from 'react-router-dom'
import { tienePermiso } from '../auth/permisos'
import { useAuth } from '../auth/useAuth'
import Icono from './Icono'
import { ORDEN_MENU, PANTALLAS } from './navegacion'

// Lista de secciones que puede ver el rol actual. `onNavegar` cierra el menú en el celular.
export default function Navegacion({ onNavegar }) {
  const { rol } = useAuth()
  const secciones = ORDEN_MENU.map((clave) => PANTALLAS[clave]).filter((p) => tienePermiso(rol, p.roles))

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {secciones.map((pantalla) => (
        <NavLink
          key={pantalla.ruta}
          to={pantalla.ruta}
          onClick={onNavegar}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-viper ${
              isActive ? 'bg-viper/15 text-viper' : 'text-texto-suave hover:text-texto hover:bg-fondo'
            }`
          }
        >
          <Icono trazo={pantalla.icono} />
          {pantalla.texto}
        </NavLink>
      ))}
    </nav>
  )
}