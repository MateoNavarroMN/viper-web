import { Link } from 'react-router-dom'
import { rutaInicio } from '../rutaInicio'
import { useAuth } from '../useAuth'

// Se muestra cuando alguien abre por URL una pantalla que su rol no puede usar
export default function SinPermiso() {
  const { rol } = useAuth()
  return (
    <div className="max-w-md mx-auto bg-panel border border-gray-800 rounded-2xl p-8 text-center mt-8">
      <div className="w-12 h-12 bg-error/15 text-error rounded-lg flex items-center justify-center mx-auto mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h1 className="font-outfit text-3xl font-bold mb-3">Sin permiso</h1>
      <p className="text-texto-suave leading-relaxed">No tenés permiso para ver esta pantalla con tu rol.</p>
      <Link
        to={rutaInicio(rol)}
        className="inline-block mt-8 font-outfit bg-transparent border border-viper text-viper hover:bg-viper/20 px-6 py-2 rounded-lg font-semibold transition-colors duration-300"
      >
        Ir a mi panel
      </Link>
    </div>
  )
}