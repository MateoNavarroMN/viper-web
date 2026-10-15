export default function Icono({ trazo, tamano = 20 }) {
  return (
    <svg className="shrink-0" width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazo} />
    </svg>
  )
}