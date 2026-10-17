import { createContext } from 'react'

// Valor: { usuario, rol, autenticado, cargando, login, logout } (lo arma AuthProvider)
export const AuthContext = createContext(null)