// Mensaje informativo de un bloque del portal (cuando no hay nada para mostrar): ícono de información, un título y una línea de ayuda.
export default function Aviso({ titulo, detalle, children }) {
  return (
    <div className="bg-fondo border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-3">
      <svg className="shrink-0 mt-0.5 text-texto-suave" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold break-words">{titulo}</p>
        {detalle && <p className="text-sm text-texto-suave mt-0.5 break-words">{detalle}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}