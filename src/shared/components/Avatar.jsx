import { Blobatar } from '@blobatar/react'

const PALETA_VIPER = [
  '#10b981', // Verde
  '#3b82f6', // Azul
  '#f59e0b', // Ámbar
  '#ef4444', // Rojo
  '#8b5cf6'  // Violeta
]

// Avatar generado con Blobatar (blobatar.dev): mismo texto base, mismo dibujo.
// `semilla` debe ser un dato estable del usuario (su id).
export default function Avatar({ semilla, tamano = 40, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full bg-panel ${className}`}
      style={{ width: tamano, height: tamano }}
      aria-hidden="true"
    >
      <Blobatar
        name={String(semilla)}
        size={tamano}
        colors={PALETA_VIPER}
      />
    </span>
  )
}