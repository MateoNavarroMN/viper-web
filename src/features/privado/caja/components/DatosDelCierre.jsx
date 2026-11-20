import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { diferenciaConSigno, importe } from '../caja'

function Dato({ titulo, children, clase = '' }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">{titulo}</dt>
      <dd className={`mt-1 font-semibold tabular-nums break-words ${clase}`}>{children}</dd>
    </div>
  )
}

// Lo que quedó registrado en un cierre: responsable, efectivo calculado y declarado, total digital, diferencia y estado.
// `cierre` viene de /caja/cierre (al cerrar) o de /caja/cierre/resumen (jornada ya cerrada).
export default function DatosDelCierre({ cierre }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Dato titulo="Responsable">{cierre.responsable}</Dato>
      <Dato titulo="Estado del cierre">
        <EstadoBadge tipo="cierre" estado={cierre.estado} />
      </Dato>
      <Dato titulo="Efectivo calculado">{importe(cierre.efectivoCalculado)}</Dato>
      <Dato titulo="Efectivo declarado">{importe(cierre.efectivoDeclarado)}</Dato>
      <Dato titulo="Total digital">{importe(cierre.totalDigital)}</Dato>
      <Dato titulo="Diferencia" clase={cierre.diferencia === 0 ? '' : 'text-error'}>
        {diferenciaConSigno(cierre.diferencia)}
      </Dato>
    </dl>
  )
}