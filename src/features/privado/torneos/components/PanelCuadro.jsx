import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { motivoSinCorreccion } from '../resultado'
import { accionesDeGestion, ETIQUETA_INSTANCIA } from '../torneos'
import AmpliarFechaFin from './AmpliarFechaFin'
import Bracket from './Bracket'
import PartidosSinFranja from './PartidosSinFranja'
import RegenerarCuadro from './RegenerarCuadro'
import Zonas from './Zonas'

// Todos los partidos del cuadro, cada uno con `lugar`: la zona o la instancia de eliminatoria
const todosLosPartidos = (zonas, rondas) => [
  ...zonas.flatMap((zona) => zona.partidos.map((partido) => ({ ...partido, lugar: zona.nombre }))),
  ...rondas.flatMap((ronda) => ronda.partidos.map((partido) => ({ ...partido, lugar: ETIQUETA_INSTANCIA[partido.instancia] ?? partido.instancia }))),
]

// Pestaña «Cuadro / Zonas» de la ficha del torneo. Antes de generar lleva a la pantalla de generación (CU 3.4 · paso 1);
// una vez generado, muestra el cuadro de eliminación con <Bracket> o las zonas con <Zonas>. Un torneo con zonas cuya fase
// eliminatoria ya se generó (CU 3.9) muestra las dos con una pestaña por fase.
// `puedeGestionar` es Organizador o Administrador: ve los partidos sin cancha ni horario (5a) con sus acciones, y el botón
// «Regenerar cuadro» (6a); «Programar» y «Reprogramar» llevan a la grilla de canchas del partido (CU 3.5) y «Cargar resultado», a la pantalla del marcador (CU 3.6).
// `onCambio` avisa a la ficha que el torneo cambió (se regeneró el cuadro o se amplió la fecha de fin) para que lo vuelva a pedir.
export default function PanelCuadro({ torneo, puedeGestionar, onCambio }) {
  const navigate = useNavigate()
  const irAGenerar = () => navigate(`/gestion/torneos/${torneo.id}/generar-cuadro`)
  const programar = (partido) => navigate(`/gestion/torneos/${torneo.id}/partidos/${partido.id}/programar`)

  const generado = ['EN_CURSO', 'FINALIZADO', 'ARCHIVADO'].includes(torneo.estado)

  const [reintento, setReintento] = useState(0)
  const [fase, setFase] = useState('zonas') // solo con zonas y fase eliminatoria generada
  const [ampliando, setAmpliando] = useState(false)
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

  const cambio = () => {
    setReintento((n) => n + 1)
    onCambio?.()
  }

  let contenido
  let partidos = []
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
    partidos = todosLosPartidos(actual.zonas, actual.rondas)
    const acciones = puedeGestionar ? accionesDeGestion(torneo.id, navigate, (partido) => motivoSinCorreccion(partido, actual, torneo)) : []
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

  // Partidos con los dos rivales que no entraron en el período del torneo (5a)
  const sinFranja = partidos.filter((p) => p.local && p.visitante && !p.esBye && p.estado === 'PENDIENTE' && !p.programacion)
  const conResultados = partidos.some((p) => !p.esBye && (p.estado === 'FINALIZADO' || p.estado === 'WO'))

  return (
    <div className="flex flex-col gap-6">
      {puedeGestionar && torneo.estado === 'EN_CURSO' && actual && !actual.error && (
        <RegenerarCuadro torneo={torneo} conResultados={conResultados} onHecho={cambio} />
      )}
      {puedeGestionar && sinFranja.length > 0 && (
        <PartidosSinFranja partidos={sinFranja} onProgramar={programar} onAmpliar={() => setAmpliando(true)} />
      )}
      {contenido}
      {ampliando && <AmpliarFechaFin torneo={torneo} onHecho={() => { setAmpliando(false); cambio() }} onCerrar={() => setAmpliando(false)} />}
    </div>
  )
}