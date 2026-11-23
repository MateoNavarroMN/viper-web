import { useEffect, useRef } from 'react'
import Button from '../../../../shared/components/Button'

// Marco de las pantallas de detalle del Dashboard (un rubro o una alerta): botón para volver y el contenido.
// Al abrirse lleva la vista hasta arriba, porque se llega desde un bloque que puede estar muy abajo.
export default function DetalleDashboard({ onVolver, children }) {
  const raiz = useRef(null)
  useEffect(() => {
    raiz.current?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div ref={raiz} className="max-w-6xl mx-auto flex flex-col gap-6 scroll-mt-6">
      <div>
        <Button variante="neutro" onClick={onVolver}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          Volver al Dashboard
        </Button>
      </div>
      {children}
    </div>
  )
}