import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Avatar from '../../../shared/components/Avatar'
import Logo from '../../../shared/components/Logo'
import { rutaInicio } from '../auth/rutaInicio'
import { useAuth } from '../auth/useAuth'
import { useTema } from '../../../shared/hooks/useTema'
import BotonTema from './BotonTema'
import MenuUsuario from './MenuUsuario'
import Navegacion from './Navegacion.jsx'
import { migasDe, PANTALLAS } from './navegacion'

const ANCHO_MENU = { minimo: 240, maximo: 440, inicial: 240, paso: 16 }
const CLAVE_ANCHO = 'viper_ancho_menu'

const anchoGuardado = () => {
  try {
    const guardado = Number(localStorage.getItem(CLAVE_ANCHO))
    return guardado >= ANCHO_MENU.minimo && guardado <= ANCHO_MENU.maximo ? guardado : ANCHO_MENU.inicial
  } catch {
    return ANCHO_MENU.inicial
  }
}

// Marco de todas las pantallas privadas: menú lateral fijo en escritorio (desde lg), menú que se
// desliza desde la izquierda en el celular, y un header con el menú del usuario. El menú de escritorio se puede ensanchar
// arrastrando su borde (o con las flechas, estando el borde enfocado) para ver nombres largos; doble clic lo devuelve a su ancho.
export default function AppLayout() {
  const { rol, usuario } = useAuth()
  const { tema, alternar: alternarTema } = useTema()
  const migas = migasDe(useLocation().pathname)
  const padre = migas.length > 1 ? migas[migas.length - 2] : null // en el celular solo se ve la pantalla actual y un ‹ para volver a esta
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const panelDrawer = useRef(null)
  const [ancho, setAncho] = useState(anchoGuardado)

  const fijarAncho = useCallback((valor) => {
    const nuevo = Math.min(ANCHO_MENU.maximo, Math.max(ANCHO_MENU.minimo, Math.round(valor)))
    setAncho(nuevo)
    try {
      localStorage.setItem(CLAVE_ANCHO, String(nuevo))
    } catch {
      // sin almacenamiento el ancho vale solo para esta visita
    }
  }, [])

  const arrastrar = (evento) => {
    evento.preventDefault()
    const mover = (e) => fijarAncho(e.clientX)
    const soltar = () => {
      document.removeEventListener('pointermove', mover)
      document.removeEventListener('pointerup', soltar)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('pointermove', mover)
    document.addEventListener('pointerup', soltar)
  }

  const teclearBorde = (evento) => {
    if (evento.key === 'ArrowLeft') fijarAncho(ancho - ANCHO_MENU.paso)
    else if (evento.key === 'ArrowRight') fijarAncho(ancho + ANCHO_MENU.paso)
    else if (evento.key === 'Home') fijarAncho(ANCHO_MENU.minimo)
    else if (evento.key === 'End') fijarAncho(ANCHO_MENU.maximo)
    else return
    evento.preventDefault()
  }

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
    <div className="min-h-screen bg-fondo" style={{ '--ancho-menu': `${ancho}px` }}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:bg-viper focus:text-black focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Saltar al contenido
      </a>

      {/* Escritorio */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[var(--ancho-menu)] flex-col gap-8 bg-panel border-r border-gray-800 px-3 py-6">
        <Link to={rutaInicio(rol)} className="px-3 hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <div className="flex-1 overflow-y-auto sin-barra">
          <Navegacion />
        </div>
        <div className="border-t border-gray-800 pt-3">
          <MenuUsuario />
        </div>
        {/* Borde para ensanchar el menú */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ancho del menú lateral"
          aria-valuemin={ANCHO_MENU.minimo}
          aria-valuemax={ANCHO_MENU.maximo}
          aria-valuenow={ancho}
          tabIndex={0}
          title="Arrastrá para ensanchar el menú (doble clic para restablecer)"
          onPointerDown={arrastrar}
          onDoubleClick={() => fijarAncho(ANCHO_MENU.inicial)}
          onKeyDown={teclearBorde}
          className="absolute inset-y-0 -right-1.5 w-3 cursor-col-resize group focus:outline-none"
        >
          <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-viper/60 group-focus-visible:bg-viper transition-colors" />
        </div>
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
            <div className="flex items-center justify-between px-3">
              <Logo />
              <button type="button" onClick={() => setDrawerAbierto(false)} aria-label="Cerrar menú" className="text-texto-suave hover:text-viper transition-colors cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto sin-barra">
              <Navegacion onNavegar={() => setDrawerAbierto(false)} />
            </div>
            <div className="border-t border-gray-800 pt-3">
              <MenuUsuario onNavegar={() => setDrawerAbierto(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-[var(--ancho-menu)] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 sm:px-8 bg-fondo/90 backdrop-blur border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
              className="lg:hidden p-2 -ml-2 rounded-lg text-texto-suave hover:text-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            {padre?.ruta && (
              <Link to={padre.ruta} state={padre.estado} aria-label={`Volver a ${padre.texto}`} className="sm:hidden -ml-1 px-2 py-1 text-xl leading-none text-texto-suave hover:text-viper transition-colors">
                <span aria-hidden="true">‹</span>
              </Link>
            )}
            <nav aria-label="Ubicación" className="min-w-0">
              <ol className="flex items-center gap-2 text-sm text-texto-suave whitespace-nowrap overflow-hidden">
                {migas.map((miga, i) => {
                  const ultima = i === migas.length - 1
                  return (
                    <li key={`${miga.texto}-${i}`} className={`items-center gap-2 ${ultima ? 'flex' : 'hidden sm:flex'}`}>
                      {i > 0 && <span className="hidden sm:inline" aria-hidden="true">›</span>}
                      {ultima || !miga.ruta ? (
                        <span className={ultima ? 'text-texto' : undefined} aria-current={ultima ? 'page' : undefined}>{miga.texto}</span>
                      ) : (
                        <Link to={miga.ruta} state={miga.estado} className="hover:text-viper transition-colors rounded focus-visible:outline-2 focus-visible:outline-viper">{miga.texto}</Link>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <BotonTema tema={tema} onAlternar={alternarTema} />
            <button type="button" aria-label="Notificaciones" className="p-2 rounded-lg text-texto-suave hover:text-viper transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
            <Link to={PANTALLAS.perfil.ruta} aria-label="Mi perfil" className="rounded-full focus-visible:outline-2 focus-visible:outline-viper">
              <Avatar semilla={usuario.id} tamano={32} />
            </Link>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="flex-1 px-4 sm:px-8 py-8 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}