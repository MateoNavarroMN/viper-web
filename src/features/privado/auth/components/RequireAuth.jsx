import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from '../../../../shared/components/Spinner'
import { useAuth } from '../useAuth'

// Envuelve las rutas privadas. Sin sesión lleva a /login.
export default function RequireAuth() {
  const { autenticado, cargando } = useAuth()
  const location = useLocation()

  // Mientras /auth/me no contestó no sabemos si hay sesión: se espera en vez de mandar a /login
  if (cargando) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}