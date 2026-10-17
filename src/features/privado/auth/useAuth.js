import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// const { usuario, rol, autenticado, cargando, login, logout } = useAuth()
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth se usa dentro de <AuthProvider>')
  return contexto
}