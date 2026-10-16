// Dato de solo lectura con aspecto de campo y candado (se muestra en Mi perfil y en Editar datos).
export default function CampoBloqueado({ etiqueta, valor }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="text-[13px] text-texto-suave">{etiqueta}</span>
      <div className="flex items-center justify-between gap-3 bg-fondo border border-gray-800 rounded-lg px-4 py-3 text-sm text-texto-suave">
        <span className="truncate" title={valor}>{valor || 'Sin cargar'}</span>
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span className="sr-only">(solo lectura)</span>
      </div>
    </div>
  )
}