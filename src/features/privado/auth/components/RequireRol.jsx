import { Outlet } from 'react-router-dom'
import { tienePermiso } from '../permisos'
import { useAuth } from '../useAuth'
import SinPermiso from './SinPermiso'

// Va dentro de RequireAuth. Si el rol no alcanza, muestra la página "Sin permiso" sin cambiar la URL.
export default function RequireRol({ roles }) {
  const { rol } = useAuth()
  if (!tienePermiso(rol, roles)) return <SinPermiso />
  return <Outlet />
}