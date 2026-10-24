import { useState } from 'react'
import Tabs from '../../../../shared/components/Tabs'
import PanelCronograma from './PanelCronograma'
import PanelCuadro from './PanelCuadro'

const PESTANAS = [
  { clave: 'cuadro', titulo: 'Cuadro / Zonas' },
  { clave: 'cronograma', titulo: 'Cronograma' },
]

// Lo que ve el jugador de un torneo en curso en su ficha: el cuadro o las zonas y el cronograma de partidos, sin las
// acciones del Organizador. Abre en el cronograma, que es donde está «Solo mis partidos».
export default function PanelSeguimiento({ torneo, jugadorId }) {
  const [pestana, setPestana] = useState('cronograma')
  return (
    <section className="flex flex-col gap-6" aria-label="Seguimiento del torneo">
      <Tabs pestanas={PESTANAS} activa={pestana} onCambiar={setPestana} />
      <div role="tabpanel">
        {pestana === 'cuadro' ? <PanelCuadro torneo={torneo} puedeGestionar={false} /> : <PanelCronograma torneo={torneo} jugadorId={jugadorId} />}
      </div>
    </section>
  )
}