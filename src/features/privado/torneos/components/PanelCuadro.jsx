import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { ACCIONES_PARTIDO } from '../torneos'
import Bracket from './Bracket'

// Pestaña «Cuadro / Zonas» de la ficha del torneo. Antes de generar lleva a la pantalla de generación (CU 3.4 · paso 1);
// una vez generado, muestra el cuadro de eliminación con <Bracket>. Las zonas de un torneo con zonas se dibujan con su
// propio componente (todavía no está: por ahora dice que el cuadro está generado).
// `puedeGestionar` es Organizador o Administrador. `sinProgramar` es la cantidad de partidos que quedaron sin cancha ni
// horario al generar (5a), si se acaba de generar.
export default function PanelCuadro({ torneo, puedeGestionar, sinProgramar = 0 }) {
  const navigate = useNavigate()
  const irAGenerar = () => navigate(`/gestion/torneos/${torneo.id}/generar-cuadro`)

  const generado = ['EN_CURSO', 'FINALIZADO', 'ARCHIVADO'].includes(torneo.estado)
  const conEliminacion = generado && torneo.formato === 'ELIMINACION_DIRECTA'

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, rondas, error }
  const clave = `${torneo.id}|${torneo.estado}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    if (!conEliminacion) return undefined
    let vigente = true
    get(`/torneos/${torneo.id}/cuadro`)
      .then((r) => vigente && setResultado({ clave, rondas: r.rondas }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [conEliminacion, torneo.id, clave])

  let contenido
  if (torneo.estado === 'PLANIFICADO' || torneo.estado === 'INSCRIPCIONES_ABIERTAS') {
    contenido = <EmptyState titulo="Todavía no hay cuadro" descripcion="El cuadro se genera cuando se cierran las inscripciones." />
  } else if (torneo.estado === 'INSCRIPCIONES_CERRADAS') {
    contenido = (
      <EmptyState
        titulo="Todavía no generaste el cuadro"
        descripcion="Revisá el resumen y generá la competencia con las inscripciones pagadas."
        accion={puedeGestionar ? <Button onClick={irAGenerar}>Generar Cuadro de Competencia</Button> : null}
      />
    )
  } else if (torneo.estado === 'CANCELADO') {
    contenido = <Alert variante="info">El torneo se canceló antes de generar el cuadro.</Alert>
  } else if (!conEliminacion) {
    contenido = <EmptyState titulo="Cuadro generado" descripcion="Acá vas a ver las zonas de la competencia." />
  } else if (!actual) {
    contenido = (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando cuadro" />
      </div>
    )
  } else if (actual.error) {
    contenido = (
      <Alert variante="error" titulo="No pudimos cargar el cuadro">
        {actual.error}{' '}
        <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  } else {
    contenido = <Bracket rondas={actual.rondas} acciones={puedeGestionar ? ACCIONES_PARTIDO : []} />
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