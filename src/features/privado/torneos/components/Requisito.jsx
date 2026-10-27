// Un requisito de la lista de las pantallas de generación (cuadro y fase eliminatoria): cumplido (tilde verde),
// sin cumplir (cruz roja) u opcional sin configurar (guion ámbar).
const ESTILOS = {
  cumplido: { clases: 'bg-viper/15 text-viper', trazo: 'm5 12 5 5L20 7' },
  pendiente: { clases: 'bg-error/15 text-error', trazo: 'M6 6l12 12M18 6 6 18' },
  opcional: { clases: 'bg-advertencia/15 text-advertencia', trazo: 'M6 12h12' },
}

export default function Requisito({ estado, children }) {
  const { clases, trazo } = ESTILOS[estado]
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${clases}`} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={trazo} />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  )
}