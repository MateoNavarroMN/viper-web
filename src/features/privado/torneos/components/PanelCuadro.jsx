import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { ACCIONES_PARTIDO } from '../torneos'
import Bracket from './Bracket'
import Zonas from './Zonas'

// Pestaña «Cuadro / Zonas» de la ficha del torneo. Antes de generar lleva a la pantalla de generación (CU 3.4 · paso 1);
// una vez generado, muestra el cuadro de eliminación con <Bracket> o las zonas con <Zonas>. Un torneo con zonas cuya fase
// eliminatoria ya se generó (CU 3.9) muestra las dos con una pestaña por fase.
// `puedeGestionar` es Organizador o Administrador. `sinProgramar` es la cantidad de partidos que quedaron sin cancha ni
// horario al generar (5a), si se acaba de generar.
export default function PanelCuadro({ torneo, puedeGestionar, sinProgramar = 0 }) {
  const navigate = useNavigate()
  const irAGenerar = () => navigate(`/gestion/torneos/${torneo.id}/generar-cuadro`)

  const generado = ['EN_CURSO', 'FINALIZADO', 'ARCHIVADO'].includes(torneo.estado)

  const [reintento, setReintento] = useState(0)
  const [fase, setFase] = useState('zonas') // solo con zonas y fase eliminatoria generada
  const [resultado, setResultado] = useState(null) // { clave, zonas, rondas, error }
  const clave = `${torneo.id}|${torneo.estado}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    if (!generado) return undefined
    let vigente = true
    get(`/torneos/${torneo.id}/cuadro`)
      .then((r) => vigente && setResultado({ clave, zonas: r.zonas, rondas: r.rondas }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [generado, torneo.id, clave])

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
    const acciones = puedeGestionar ? ACCIONES_PARTIDO : []
    const bracket = <Bracket rondas={actual.rondas} acciones={acciones} />
    const zonas = <Zonas zonas={actual.zonas} disciplina={torneo.disciplina} acciones={acciones} />
    if (torneo.formato === 'ELIMINACION_DIRECTA') {
      contenido = bracket
    } else if (actual.rondas.length === 0) {
      contenido = zonas
    } else {
      contenido = (
        <div className="flex flex-col gap-6">
          <Tabs pestanas={[{ clave: 'zonas', titulo: 'Zonas' }, { clave: 'eliminatoria', titulo: 'Eliminatoria' }]} activa={fase} onCambiar={setFase} />
          {fase === 'zonas' ? zonas : bracket}
        </div>
      )
    }
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