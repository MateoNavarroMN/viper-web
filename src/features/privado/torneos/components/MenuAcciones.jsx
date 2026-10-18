import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Botón ⋮ con un menú desplegable. items: [{ texto, to?, onClick?, peligro? }].
// Un item con `peligro` va al final, separado y en rojo (por ejemplo «Cancelar torneo»).
// Se cierra con Escape (devuelve el foco al botón), tocando afuera o al elegir una opción.
export default function MenuAcciones({ etiqueta, items }) {
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

  if (items.length === 0) return null

  const clases = (peligro) =>
    `w-full block px-4 py-3 text-left text-sm hover:bg-fondo transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper ${peligro ? 'text-error' : ''}`

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={etiqueta}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-texto-suave hover:text-texto hover:bg-fondo transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {abierto && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-56 bg-panel border border-gray-800 rounded-xl overflow-hidden z-40 shadow-xl shadow-black/40">
          {items.map(({ texto, to, onClick, peligro }) => (
            <div key={texto} className={peligro ? 'border-t border-gray-800' : ''}>
              {to ? (
                <Link role="menuitem" to={to} className={clases(peligro)}>
                  {texto}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false)
                    onClick()
                  }}
                  className={clases(peligro)}
                >
                  {texto}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}