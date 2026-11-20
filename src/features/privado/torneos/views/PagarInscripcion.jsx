import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import PantallaDePago from '../../pagos/components/PantallaDePago'
import { ETIQUETA_DISCIPLINA, fechaHora, precio } from '../torneos'
import { useInscripcionAPagar } from '../useInscripcionAPagar'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIS_INSCRIPCIONES = '/portal/torneos?vista=mias'

// Por qué una inscripción ya no se puede pagar en línea (o null si se puede)
const motivoNoPagable = (inscripcion, torneo, ahora) => {
  if (!inscripcion.esTitular) return 'Solo quien hizo la inscripción puede pagarla en línea.'
  if (inscripcion.estado === 'ANULADA') return 'La inscripción se anuló porque no se pagó a tiempo.'
  if (inscripcion.estadoPago === 'PAGADO') return 'Esta inscripción ya está paga.'
  if (inscripcion.venceEn && new Date(inscripcion.venceEn).getTime() <= ahora) return 'El plazo de pago de esta inscripción venció.'
  if (!(torneo.precioInscripcion > 0)) return 'Esta inscripción no tiene importe para pagar.'
  return null
}

// Pantalla «Pagar inscripción»: el Jugador que se inscribió elige pagar en línea con Mercado Pago o en recepción.
// Se llega desde la inscripción a un torneo y desde «Mis inscripciones».
export default function PagarInscripcion() {
  const { inscripcionId } = useParams()
  const navigate = useNavigate()
  const [ahora] = useState(() => Date.now())
  const valido = REGEX_ID.test(inscripcionId ?? '')
  const { cargando, error, noExiste, inscripcion, torneo, reintentar } = useInscripcionAPagar(valido ? inscripcionId : '')
  const volver = () => navigate(MIS_INSCRIPCIONES)

  if (!valido || noExiste) {
    return <EmptyState titulo="No encontramos esa inscripción" descripcion="Revisá tus inscripciones para elegir cuál pagar." accion={<Button onClick={volver}>Ir a mis inscripciones</Button>} />
  }
  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando la inscripción" /></div>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar la inscripción">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const total = precio(torneo.precioInscripcion)
  const i = inscripcion
  const lineas = [`${ETIQUETA_DISCIPLINA[i.torneo.disciplina]} · Categoría ${i.torneo.categoria}`]
  if (i.pareja) lineas.push(`Con ${i.pareja.nombre} ${i.pareja.apellido}`)
  if (i.estadoPago === 'PENDIENTE' && i.estado === 'ACTIVA' && i.venceEn) lineas.push(`Tu cupo está reservado hasta el ${fechaHora(i.venceEn)}`)

  return (
    <PantallaDePago
      concepto="INSCRIPCION"
      origenId={i.id}
      nombreOrigen="inscripción"
      titulo="Pagar inscripción"
      subtitulo={{ pagable: 'Elegí cómo abonar tu inscripción.', noPagable: 'Esta inscripción no se puede pagar ahora.' }}
      volverA={MIS_INSCRIPCIONES}
      textoVolver="Volver a mis inscripciones"
      etiquetaOrigen="Inscripción a pagar"
      tituloOrigen={torneo.nombre}
      lineas={lineas}
      insignia={<EstadoBadge tipo="pago" estado={i.estadoPago} />}
      total={total}
      filas={[
        { titulo: 'Concepto', valor: 'Inscripción' },
        { titulo: 'Torneo', valor: torneo.nombre },
        { titulo: 'Categoría', valor: i.torneo.categoria },
      ]}
      motivo={motivoNoPagable(i, torneo, ahora)}
    />
  )
}