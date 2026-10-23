import { useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'

// Pestaña «Cuadro / Zonas» de la ficha del torneo. Antes de generar lleva a la pantalla de generación (CU 3.4 · paso 1);
// una vez generado, todavía no dibuja el cuadro (llega con el componente visual de cuadro y de zonas).
// `sinProgramar` es la cantidad de partidos que quedaron sin cancha ni horario al generar (5a), si se acaba de generar.
export default function PanelCuadro({ torneo, puedeGenerar, sinProgramar = 0 }) {
  const navigate = useNavigate()
  const irAGenerar = () => navigate(`/gestion/torneos/${torneo.id}/generar-cuadro`)

  let contenido
  if (torneo.estado === 'PLANIFICADO' || torneo.estado === 'INSCRIPCIONES_ABIERTAS') {
    contenido = <EmptyState titulo="Todavía no hay cuadro" descripcion="El cuadro se genera cuando se cierran las inscripciones." />
  } else if (torneo.estado === 'INSCRIPCIONES_CERRADAS') {
    contenido = (
      <EmptyState
        titulo="Todavía no generaste el cuadro"
        descripcion="Revisá el resumen y generá la competencia con las inscripciones pagadas."
        accion={puedeGenerar ? <Button onClick={irAGenerar}>Generar Cuadro de Competencia</Button> : null}
      />
    )
  } else if (torneo.estado === 'CANCELADO') {
    contenido = <Alert variante="info">El torneo se canceló antes de generar el cuadro.</Alert>
  } else {
    contenido = <EmptyState titulo="Cuadro generado" descripcion="Acá vas a ver las zonas y el cuadro de la competencia." />
  }

  return (
    <div className="flex flex-col gap-6">
      {sinProgramar > 0 && (
        <Alert variante="advertencia" titulo="Faltan franjas para programar todos los partidos">
          {sinProgramar === 1
            ? 'Hay 1 partido sin cancha ni horario dentro del período del torneo.'
            : `Hay ${sinProgramar} partidos sin cancha ni horario dentro del período del torneo.`}
        </Alert>
      )}
      {contenido}
    </div>
  )
}
