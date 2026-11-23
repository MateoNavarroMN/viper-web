import { useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Paginacion from '../../../../shared/components/Paginacion'
import Spinner from '../../../../shared/components/Spinner'
import Table from '../../../../shared/components/Table'
import { ETIQUETA_CONCEPTO, ETIQUETA_METODO_PAGO, fechaYHora, importeConSigno } from '../../caja/caja'
import { useConsulta } from '../useConsulta'
import { ETIQUETA_RUBRO, dinero, rangoEscrito } from '../dashboard'
import DetalleDashboard from './DetalleDashboard'

const POR_PAGINA = 10

const COLUMNAS = [
  { clave: 'fechaHora', titulo: 'Fecha y hora', render: (m) => <span className="whitespace-nowrap">{fechaYHora(m.fechaHora)}</span> },
  { clave: 'concepto', titulo: 'Concepto', render: (m) => ETIQUETA_CONCEPTO[m.concepto] },
  { clave: 'descripcion', titulo: 'Descripción', render: (m) => m.descripcion ?? '—' },
  { clave: 'monto', titulo: 'Monto', render: (m) => <span className={`font-semibold tabular-nums whitespace-nowrap ${m.tipo === 'INGRESO' ? 'text-exito' : 'text-advertencia'}`}>{importeConSigno(m)}</span> },
  { clave: 'metodoPago', titulo: 'Medio de pago', render: (m) => ETIQUETA_METODO_PAGO[m.metodoPago] },
  { clave: 'operador', titulo: 'Operador', render: (m) => m.operador ?? 'Sistema' },
]

// Detalle de un rubro del balance: los movimientos aprobados que lo componen, del período que se está mirando. Paginado.
export default function DetalleRubro({ rubro, desde, hasta, onVolver }) {
  const [pagina, setPagina] = useState(1)
  const { datos, cargando, error, reintentar } = useConsulta(
    `/dashboard/rubros/${rubro}/movimientos?desde=${desde}&hasta=${hasta}&pagina=${pagina}&tamanio=${POR_PAGINA}`
  )

  const esIngreso = datos ? datos.totales.ingresos > 0 || datos.totales.egresos === 0 : true
  const total = datos ? (esIngreso ? datos.totales.ingresos : datos.totales.egresos) : 0
  const paginacion = (etiqueta) => datos && (
    <Paginacion
      pagina={datos.pagina}
      totalPaginas={datos.totalPaginas}
      onCambiar={setPagina}
      etiqueta={etiqueta}
      resumen={`${datos.total} ${datos.total === 1 ? 'movimiento' : 'movimientos'}`}
    />
  )

  return (
    <DetalleDashboard onVolver={onVolver}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-outfit text-[28px] font-bold">{ETIQUETA_RUBRO[rubro]}</h1>
          <p className="text-texto-suave text-sm mt-1">Movimientos del {rangoEscrito(desde, hasta)}</p>
        </div>
        {datos && (
          <div className="sm:text-right">
            <p className="text-sm text-texto-suave">{esIngreso ? 'Total de ingresos' : 'Total de egresos'}</p>
            <p className={`font-outfit text-2xl font-bold tabular-nums ${esIngreso ? 'text-exito' : 'text-advertencia'}`}>{dinero(total)}</p>
          </div>
        )}
      </div>

      {!datos && cargando && <div className="py-16 flex justify-center"><Spinner texto="Cargando los movimientos" /></div>}
      {!datos && error && (
        <Alert variante="error" titulo="No se pudieron cargar los movimientos">
          {error}{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}
      {datos && (
        datos.sinMovimientos ? (
          <EmptyState titulo={`No hay movimientos de ${ETIQUETA_RUBRO[rubro]}`} descripcion="No hay movimientos aprobados en el rango elegido." />
        ) : (
          <div className={`flex flex-col gap-4 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
            {error && (
              <Alert variante="error" titulo="No se pudo cargar la página">
                {error}{' '}
                <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
              </Alert>
            )}
            {paginacion('Paginación de los movimientos, arriba')}
            <Table columnas={COLUMNAS} filas={datos.movimientos} />
            {paginacion('Paginación de los movimientos, abajo')}
          </div>
        )
      )}
    </DetalleDashboard>
  )
}