import Button from '../../../../shared/components/Button'

// La búsqueda o los filtros no devolvieron cuotas
export default function SinResultadosCuotas({ hayFiltros, onLimpiar }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-fondo border border-gray-800 flex items-center justify-center text-texto-suave mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h2 className="font-outfit text-lg font-bold">No se encontraron cuotas</h2>
      <p className="text-texto-suave text-sm mt-2">
        {hayFiltros ? 'No hay cuotas para ese período o ese socio. Probá con otros filtros.' : 'Todavía no hay cuotas generadas.'}
      </p>
      {hayFiltros && (
        <Button variante="secundario" onClick={onLimpiar} className="mt-6">
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}