import { useNavigate, useParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import PantallaDePago from '../../pagos/components/PantallaDePago'
import { estadoDeCuota, nombrePeriodo } from '../../socios/socios'
import { fechaCompleta, precio } from '../../torneos/torneos'
import { useCuotaAPagar } from '../useCuotaAPagar'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MI_ACTIVIDAD = '/perfil?seccion=actividad'

// Pantalla «Pagar cuota»: el socio elige pagar su cuota en línea con Mercado Pago o en recepción. Se llega desde «Mis cuotas».
export default function PagarCuota() {
  const { cuotaId } = useParams()
  const navigate = useNavigate()
  const valido = REGEX_ID.test(cuotaId ?? '')
  const { cargando, error, noExiste, cuota, reintentar } = useCuotaAPagar(valido ? cuotaId : '')
  const volver = () => navigate(MI_ACTIVIDAD)

  if (!valido || noExiste) {
    return <EmptyState titulo="No encontramos esa cuota" descripcion="Revisá tus cuotas en Mi actividad para elegir cuál pagar." accion={<Button onClick={volver}>Ir a mi actividad</Button>} />
  }
  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando la cuota" /></div>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar la cuota">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const periodo = nombrePeriodo(cuota.mes, cuota.anio)
  const total = precio(Number(cuota.monto))
  const estado = estadoDeCuota(cuota)

  return (
    <PantallaDePago
      concepto="CUOTA"
      origenId={cuota.id}
      nombreOrigen="cuota"
      titulo="Pagar cuota"
      subtitulo={{ pagable: 'Elegí cómo abonar tu cuota.', noPagable: 'Esta cuota no se puede pagar ahora.' }}
      volverA={MI_ACTIVIDAD}
      textoVolver="Volver a mi actividad"
      etiquetaOrigen="Cuota a pagar"
      tituloOrigen={`Cuota de ${periodo}`}
      lineas={[estado === 'VENCIDA' ? `Venció el ${fechaCompleta(cuota.fechaVencimiento)}` : `Vence el ${fechaCompleta(cuota.fechaVencimiento)}`]}
      insignia={<EstadoBadge tipo="cuota" estado={estado} />}
      total={total}
      filas={[
        { titulo: 'Concepto', valor: 'Cuota de socio' },
        { titulo: 'Período', valor: periodo },
      ]}
      motivo={cuota.estadoPago === 'PAGADO' ? 'Esta cuota ya está paga.' : null}
    />
  )
}