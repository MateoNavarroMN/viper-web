import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { rutaInicio } from '../auth/rutaInicio'
import { useAuth } from '../auth/useAuth'
import MenuUsuario from './MenuUsuario'
import Navegacion from './Navegacion.jsx'

const Logo = () => (
  <span className="font-outfit text-2xl font-bold tracking-wide">
    VIPER <span className="text-viper">|</span>
  </span>
)

// Marco de todas las pantallas privadas: menú lateral fijo en escritorio (desde lg), menú que se
// desliza desde la izquierda en el celular, y un header con el menú del usuario.
export default function AppLayout() {
  const { rol } = useAuth()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const panelDrawer = useRef(null)

  // Drawer abierto: Escape lo cierra, el fondo no se desplaza y el foco entra al panel
  useEffect(() => {
    if (!drawerAbierto) return undefined
    const alTeclear = (evento) => evento.key === 'Escape' && setDrawerAbierto(false)
    document.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    panelDrawer.current?.focus()
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = ''
    }
  }, [drawerAbierto])

  return (
    <div className="min-h-screen bg-fondo">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:bg-viper focus:text-black focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Saltar al contenido
      </a>

      {/* Escritorio */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col gap-8 bg-panel border-r border-gray-800 px-4 py-6">
        <Link to={rutaInicio(rol)} className="px-4 hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <Navegacion />
      </aside>

      {/* Celular */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-[60] lg:hidden bg-black/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setDrawerAbierto(false)}>
          <div
            ref={panelDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            tabIndex={-1}
            className="h-full w-72 max-w-[85vw] bg-panel border-r border-gray-800 px-4 py-6 flex flex-col gap-8 focus:outline-none"
          >
            <div className="flex items-center justify-between px-4">
              <Logo />
              <button type="button" onClick={() => setDrawerAbierto(false)} aria-label="Cerrar menú" className="text-texto-suave hover:text-viper transition-colors cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Navegacion onNavegar={() => setDrawerAbierto(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 sm:px-6 bg-fondo/90 backdrop-blur border-b border-gray-800">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
              className="p-2 -ml-2 rounded-lg text-texto-suave hover:text-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <Logo />
          </div>
          <div className="ml-auto">
            <MenuUsuario />
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="flex-1 px-4 sm:px-6 py-8 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}