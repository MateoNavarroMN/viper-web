import { useMediaQuery } from '../hooks/useMediaQuery'
import { paginasVisibles } from '../utils/paginas'

const BASE = 'min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-viper'
const INACTIVO = 'bg-panel border-gray-800 text-texto hover:border-viper cursor-pointer'
const ACTIVO = 'bg-viper border-viper text-sobre-viper font-bold'
const FLECHA = `${BASE} w-9 px-0 bg-panel border-gray-800 text-texto hover:border-viper cursor-pointer disabled:opacity-40 disabled:hover:border-gray-800 disabled:cursor-not-allowed`

// Paginación con números de página. Se pone arriba y abajo de la lista, con las mismas propiedades:
//   pagina, totalPaginas  → la página actual (desde 1) y el total
//   onCambiar(n)          → se llama con el número de la página elegida
//   resumen               → texto opcional a la izquierda («Mostrando 10 de 120 socios»)
//   etiqueta              → nombre accesible del control; el de arriba y el de abajo tienen que llamarse distinto
// Con una sola página no muestra los números (solo el resumen, si hay).
export default function Paginacion({ pagina, totalPaginas, onCambiar, resumen = null, etiqueta = 'Paginación', className = '' }) {
  const hayVarias = totalPaginas > 1
  const esPantallaAncha = useMediaQuery('(min-width: 640px)')
  if (!hayVarias && !resumen) return null

  const paginas = hayVarias ? paginasVisibles(pagina, totalPaginas, esPantallaAncha ? 1 : 0) : []

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
      {resumen ? <p className="text-sm text-texto-suave tabular-nums" aria-live="polite">{resumen}</p> : <span />}
      {hayVarias && (
        <nav aria-label={etiqueta} className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)} className={FLECHA}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {paginas.map((n, i) => (n === null
            ? <span key={`hueco-${i}`} className="min-w-6 text-center text-texto-suave" aria-hidden="true">…</span>
            : (
              <button
                key={n}
                type="button"
                aria-label={`Página ${n}`}
                aria-current={n === pagina ? 'page' : undefined}
                onClick={() => n !== pagina && onCambiar(n)}
                className={`${BASE} ${n === pagina ? ACTIVO : INACTIVO}`}
              >
                {n}
              </button>
            )))}
          <button type="button" aria-label="Página siguiente" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)} className={FLECHA}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </nav>
      )}
    </div>
  )
}