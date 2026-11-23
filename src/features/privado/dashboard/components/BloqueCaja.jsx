import Badge from '../../../../shared/components/Badge'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { fechaDelDia, importe } from '../../caja/caja'
import { useConsulta } from '../useConsulta'
import { dinero } from '../dashboard'
import BloqueOperativo, { AvisoDeBloque, Dato } from './BloqueOperativo'

// Caja de hoy: movimientos y efectivo calculado, si está abierta o cerrada y el resultado del último cierre.
export default function BloqueCaja() {
  const consulta = useConsulta('/dashboard/caja')
  return (
    <BloqueOperativo
      titulo="Caja"
      ruta="/gestion/caja"
      consulta={consulta}
      insignia={(c) => <Badge variante={c.abierta ? 'exito' : 'neutro'}>{c.abierta ? 'Abierta' : 'Cerrada'}</Badge>}
    >
      {(c) => (
        <>
          <div className="flex flex-col gap-3">
            <Dato etiqueta="Movimientos del día" valor={c.cantidadMovimientos} />
            <Dato etiqueta="Efectivo calculado" valor={importe(c.efectivoCalculado)} />
            {c.pendientesEnLinea > 0 && <Dato etiqueta="Cobros en línea pendientes" valor={c.pendientesEnLinea} tono="text-advertencia" />}
          </div>

          {/* 5a: todavía no hubo ningún cierre */}
          {c.ultimoCierre ? (
            <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Último cierre · {fechaDelDia(c.ultimoCierre.fecha).slice(0, 5)}</p>
                <EstadoBadge tipo="cierre" estado={c.ultimoCierre.estado} />
              </div>
              <p className="text-sm">Calculado {importe(c.ultimoCierre.efectivoCalculado)} · Declarado {importe(c.ultimoCierre.efectivoDeclarado)}</p>
              {c.ultimoCierre.diferencia !== 0 && (
                <p className="text-sm font-medium text-advertencia">Diferencia {dinero(c.ultimoCierre.diferencia)}</p>
              )}
            </div>
          ) : (
            <AvisoDeBloque>Todavía no se registró ningún cierre de caja</AvisoDeBloque>
          )}
        </>
      )}
    </BloqueOperativo>
  )
}