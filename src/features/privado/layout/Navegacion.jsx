import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Icono from './Icono'
import { ORDEN_MENU_POR_ROL, PANTALLAS } from './navegacion'

// Lista de secciones que puede ver el rol actual. `onNavegar` cierra el menú en el celular.
export default function Navegacion({ onNavegar }) {
  const { rol } = useAuth()
  const secciones = (ORDEN_MENU_POR_ROL[rol] ?? []).map((clave) => PANTALLAS[clave])

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {secciones.map((pantalla) => (
        <NavLink
          key={pantalla.ruta}
          to={pantalla.ruta}
          onClick={onNavegar}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-viper ${
              isActive ? 'bg-viper/10 text-viper before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-viper' : 'text-texto-suave hover:text-texto hover:bg-fondo'
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